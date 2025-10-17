/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 * Customer 360 Mini-CRM — Interactive Modern Suitelet (SS2.1)
 * - Search customers, view KPIs, contacts, transactions, timeline.
 * - Quick actions: Log Note, Create Task, Log Call, Send Email.
 * - Async JSON POST endpoints; polished UI; no external libraries.
 * - No JSX or template literals.
 */

define(['N/ui/serverWidget','N/search','N/record','N/runtime','N/url','N/format','N/email','N/log'],
function(serverWidget, search, record, runtime, urlMod, format, email, log) {

  // ------------------------ Utilities (server) ------------------------
  function escHtml(s){ if(s===null||s===undefined) return ''; return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  function parseFloatSafe(v){ var n=parseFloat(v); return isNaN(n)?null:n; }

  function parseDateSafe(v){ try{ if(!v) return null; return format.parse({ value: v, type: format.Type.DATE }); }catch(e){ return null; } }

  function fmtDateOut(d){ try{ return format.format({ value:d, type: format.Type.DATE }); }catch(e){ return d; } }

  function resultLimit(){ return 75; } // cap list to keep UI snappy

  // ------------------------ Data (server) ------------------------
  function searchCustomers(payload){
    var q = (payload.q||'').trim();
    var minBal = parseFloatSafe(payload.min);
    var maxBal = parseFloatSafe(payload.max);
    var page = parseInt(payload.page||'1',10); if(isNaN(page)||page<1) page=1;

    var filters = [
      ['isinactive','is','F'], 'AND',
      ['stage','anyof',['CUSTOMER','LEAD','PROSPECT']]
    ];
    if(q){
      filters.push('AND');
      filters.push(['entityid','contains',q,'OR','companyname','contains',q,'OR','email','contains',q,'OR','phone','contains',q]);
    }
    if(minBal!==null){ filters.push('AND'); filters.push(['balance','greaterthanorequalto',minBal]); }
    if(maxBal!==null){ filters.push('AND'); filters.push(['balance','lessthanorequalto',maxBal]); }

    var cols = [
      search.createColumn({ name:'internalid' }),
      search.createColumn({ name:'entityid' }),
      search.createColumn({ name:'companyname' }),
      search.createColumn({ name:'email' }),
      search.createColumn({ name:'phone' }),
      search.createColumn({ name:'balance', sort: search.Sort.DESC }),
      search.createColumn({ name:'creditlimit' }),
      search.createColumn({ name:'datecreated', sort: search.Sort.DESC })
    ];

    var s = search.create({ type: search.Type.CUSTOMER, filters: filters, columns: cols });
    var rows=[], i=0, start=(page-1)*resultLimit(), end=start+resultLimit();

    s.run().each(function(r){
      if(i>=start && i<end){
        rows.push({
          id: r.getValue('internalid'),
          entityid: r.getValue('entityid') || r.getValue('companyname') || '',
          email: r.getValue('email') || '',
          phone: r.getValue('phone') || '',
          balance: r.getValue('balance') || '0.00',
          creditlimit: r.getValue('creditlimit') || '',
          datecreated: r.getValue('datecreated') || ''
        });
      }
      i++; return i < end; // stop after page
    });

    return { ok:true, page:page, count: rows.length, rows: rows };
  }

  function getCustomerKPIs(customerId){
    var out = { openInvoices:0, openInvoiceAmt:0, lastInvoiceDate:null, unbilledOrders:0, lifetimeInvoiced:0 };
    // Open invoices
    try{
      var inv = search.create({
        type: search.Type.INVOICE,
        filters: [['entity','is',customerId],'AND',['mainline','is','T']],
        columns: [
          search.createColumn({ name:'trandate', sort: search.Sort.DESC }),
          search.createColumn({ name:'amountremaining' }),
          search.createColumn({ name:'amount' })
        ]
      });
      var i=0;
      inv.run().each(function(r){
        var rem = parseFloat(r.getValue('amountremaining')||'0')||0;
        var amt = parseFloat(r.getValue('amount')||'0')||0;
        if(rem>0){ out.openInvoices += 1; out.openInvoiceAmt += rem; }
        if(i===0){ out.lastInvoiceDate = r.getValue('trandate'); }
        out.lifetimeInvoiced += amt;
        i++; return i<200; // cap
      });
    }catch(e){}

    // Unbilled sales orders
    try{
      var so = search.create({
        type: search.Type.SALES_ORDER,
        filters: [['entity','is',customerId],'AND',['mainline','is','T'],'AND',['status','noneof',['SalesOrd:F','SalesOrd:H']]], // not fully billed/closed
        columns: [ search.createColumn({ name:'tranid' }) ]
      });
      var c=0; so.run().each(function(){ c++; return c<500; });
      out.unbilledOrders = c;
    }catch(e){}

    return out;
  }

  function getCustomerDetails(customerId){
    var info = {};
    try{
      var rec = record.load({ type: record.Type.CUSTOMER, id: customerId });
      info.id = customerId;
      info.name = rec.getValue('entityid') || rec.getValue('companyname');
      info.email = rec.getValue('email') || '';
      info.phone = rec.getValue('phone') || '';
      info.balance = rec.getValue('balance') || 0;
      info.creditlimit = rec.getValue('creditlimit') || 0;
      info.terms = rec.getText('terms') || '';
      info.status = rec.getText('entitystatus') || '';
      info.currency = rec.getText('currency') || '';
      info.salesrep = rec.getText('salesrep') || '';
      info.datecreated = rec.getText('datecreated') || '';
    }catch(e){}

    // Contacts
    var contacts=[];
    try{
      var cs = search.create({
        type: search.Type.CONTACT,
        filters: [['company','anyof',customerId],'AND',['isinactive','is','F']],
        columns: [
          search.createColumn({ name:'internalid' }),
          search.createColumn({ name:'firstname' }),
          search.createColumn({ name:'lastname' }),
          search.createColumn({ name:'email' }),
          search.createColumn({ name:'phone' }),
          search.createColumn({ name:'title' })
        ]
      });
      var i=0; cs.run().each(function(r){
        contacts.push({
          id:r.getValue('internalid'),
          name: (r.getValue('firstname')||'') + ' ' + (r.getValue('lastname')||''),
          email:r.getValue('email')||'',
          phone:r.getValue('phone')||'',
          title:r.getValue('title')||''
        });
        i++; return i<50;
      });
    }catch(e){}

    // Transactions (recent invoices & SOs)
    var transactions=[];
    try{
      var tx = search.create({
        type: search.Type.TRANSACTION,
        filters: [
          ['entity','anyof',customerId],'AND',
          ['mainline','is','T'],'AND',
          ['type','anyof',['CustInvc','SalesOrd']]
        ],
        columns: [
          search.createColumn({ name:'type' }),
          search.createColumn({ name:'tranid' }),
          search.createColumn({ name:'trandate', sort: search.Sort.DESC }),
          search.createColumn({ name:'statusref' }),
          search.createColumn({ name:'amount' }),
          search.createColumn({ name:'amountremaining' })
        ]
      });
      var j=0; tx.run().each(function(r){
        transactions.push({
          type: r.getText('type'),
          tranid: r.getValue('tranid'),
          date: r.getValue('trandate'),
          status: r.getValue('statusref') || '',
          amount: r.getValue('amount') || '0.00',
          remaining: r.getValue('amountremaining') || '0.00'
        });
        j++; return j<30;
      });
    }catch(e){}

    // Activities (recent tasks + phone calls)
    var tasks=[], calls=[];
    try{
      var t = search.create({
        type: search.Type.TASK,
        filters: [['company','anyof',customerId]],
        columns: [
          search.createColumn({ name:'title' }),
          search.createColumn({ name:'duedate', sort: search.Sort.DESC }),
          search.createColumn({ name:'status' }),
          search.createColumn({ name:'owner' })
        ]
      });
      var k=0; t.run().each(function(r){
        tasks.push({
          title: r.getValue('title')||'Task',
          duedate: r.getValue('duedate')||'',
          status: r.getText('status')||'',
          owner: r.getText('owner')||''
        });
        k++; return k<20;
      });
    }catch(e){}

    try{
      var pc = search.create({
        type: search.Type.PHONE_CALL,
        filters: [['company','anyof',customerId]],
        columns: [
          search.createColumn({ name:'title' }),
          search.createColumn({ name:'startdate', sort: search.Sort.DESC }),
          search.createColumn({ name:'status' }),
          search.createColumn({ name:'message' })
        ]
      });
      var m=0; pc.run().each(function(r){
        calls.push({
          title: r.getValue('title')||'Call',
          date: r.getValue('startdate')||'',
          status: r.getText('status')||'',
          message: r.getValue('message')||''
        });
        m++; return m<20;
      });
    }catch(e){}

    var kpis = getCustomerKPIs(customerId);

    return {
      ok:true,
      info: info,
      kpis: {
        openInvoices: kpis.openInvoices,
        openInvoiceAmt: kpis.openInvoiceAmt,
        lastInvoiceDate: kpis.lastInvoiceDate,
        unbilledOrders: kpis.unbilledOrders,
        lifetimeInvoiced: kpis.lifetimeInvoiced
      },
      contacts: contacts,
      transactions: transactions,
      tasks: tasks,
      calls: calls
    };
  }

  function createNote(customerId, title, body){
    var res={ok:true};
    try{
      var recNote = record.create({ type: record.Type.NOTE });
      recNote.setValue({ fieldId:'title', value: title || 'Note' });
      recNote.setValue({ fieldId:'note', value: body || '' });
      recNote.setValue({ fieldId:'entity', value: parseInt(customerId,10) });
      res.id = recNote.save();
    }catch(e){ res.ok=false; res.message=e.message||'Error creating note'; }
    return res;
  }

  function createTask(customerId, title, dueDateStr, msg){
    var res={ok:true};
    try{
      var recTask = record.create({ type: record.Type.TASK });
      recTask.setValue({ fieldId:'title', value: title || 'Task' });
      if(msg) recTask.setValue({ fieldId:'message', value: msg });
      var due = parseDateSafe(dueDateStr);
      if(due) recTask.setValue({ fieldId:'duedate', value: due });
      recTask.setValue({ fieldId:'company', value: parseInt(customerId,10) });
      recTask.setValue({ fieldId:'assigned', value: runtime.getCurrentUser().id });
      res.id = recTask.save();
    }catch(e){ res.ok=false; res.message=e.message||'Error creating task'; }
    return res;
  }

  function createPhoneCall(customerId, title, msg, startDateStr){
    var res={ok:true};
    try{
      var recCall = record.create({ type: record.Type.PHONE_CALL });
      recCall.setValue({ fieldId:'title', value: title || 'Phone Call' });
      if(msg) recCall.setValue({ fieldId:'message', value: msg });
      var sd = parseDateSafe(startDateStr);
      if(sd) recCall.setValue({ fieldId:'startdate', value: sd });
      recCall.setValue({ fieldId:'company', value: parseInt(customerId,10) });
      res.id = recCall.save();
    }catch(e){ res.ok=false; res.message=e.message||'Error logging call'; }
    return res;
  }

  function sendCustomerEmail(customerId, subject, body){
    var res={ok:true};
    try{
      var cust = record.load({ type: record.Type.CUSTOMER, id: customerId });
      var to = cust.getValue('email');
      if(!to){ return { ok:false, message:'Customer has no email.' }; }
      email.send({
        author: runtime.getCurrentUser().id,
        recipients: to,
        subject: subject || ('Message to ' + (cust.getValue('entityid')||'Customer')),
        body: body || ''
      });
    }catch(e){ res.ok=false; res.message=e.message||'Email send failed'; }
    return res;
  }

  // ------------------------ Router ------------------------
  function handlePost(context){
    var out={ ok:false };
    try{
      var body = context.request.body||'';
      var payload={};
      try{ payload = JSON.parse(body); }catch(e){ payload={}; }
      var action=(payload.action||'').toLowerCase();

      if(action==='search'){
        out = searchCustomers(payload||{});
      } else if(action==='get'){
        out = getCustomerDetails(String(payload.customerId||'').trim());
      } else if(action==='addnote'){
        out = createNote(String(payload.customerId||''), payload.title||'', payload.body||'');
      } else if(action==='addtask'){
        out = createTask(String(payload.customerId||''), payload.title||'', payload.dueDate||'', payload.message||'');
      } else if(action==='logcall'){
        out = createPhoneCall(String(payload.customerId||''), payload.title||'', payload.message||'', payload.startDate||'');
      } else if(action==='sendemail'){
        out = sendCustomerEmail(String(payload.customerId||''), payload.subject||'', payload.body||'');
      } else {
        out = { ok:false, message:'Unknown action' };
      }
    }catch(e){
      out = { ok:false, message: e.message||'Unexpected error' };
    }
    context.response.addHeader({ name:'Content-Type', value:'application/json; charset=utf-8' });
    context.response.write(JSON.stringify(out));
  }

  function handleGet(context){
    var form = serverWidget.createForm({ title: 'Customer 360 Mini-CRM' });

    var slUrl = urlMod.resolveScript({
      scriptId: runtime.getCurrentScript().id,
      deploymentId: runtime.getCurrentScript().deploymentId
    });

    var html=[];
    // ---------- Styles
    html.push("<style>");
    html.push(":root{--bg:#0f1426;--panel:#0b1328;--card:#0f162c;--ink:#e5e7eb;--muted:#9ca3af;--accent:#8b5cf6;--ok:#22c55e;--warn:#f59e0b;--danger:#ef4444;}");
    html.push("body,.uir-machine-table-container,.uir-page{background:var(--bg)}");
    html.push(".wrap{max-width:1260px;margin:0 auto;padding:12px}");
    html.push(".layout{display:grid;grid-template-columns:280px 1fr 380px;gap:12px}");
    html.push(".card{background:linear-gradient(180deg,#0f162c,#0b1224);color:var(--ink);border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05)}");
    html.push(".card .head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06)}");
    html.push(".card .body{padding:12px 14px}");
    html.push(".title{font:700 16px ui-sans-serif;letter-spacing:.2px}");
    html.push(".muted{color:var(--muted)}");
    html.push(".input,.select{width:100%;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:#0b1328;color:#e5e7eb;font:13px ui-sans-serif}");
    html.push(".btn{padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,#131b34,#0f152b);color:#eef2ff;cursor:pointer}");
    html.push(".btn:disabled{opacity:.5;cursor:not-allowed}");
    html.push(".pill{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);font:12px ui-sans-serif;color:#e5e7eb}");
    html.push(".list{max-height:640px;overflow:auto}");
    html.push(".row{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);margin-bottom:8px;cursor:pointer}");
    html.push(".row:hover{background:rgba(255,255,255,.05)}");
    html.push(".kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}");
    html.push(".kpi{background:#0b1328;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px}");
    html.push(".kpi b{display:block;font:700 12px ui-sans-serif;color:#cbd5e1;margin-bottom:6px}");
    html.push(".kpi .v{font:700 16px ui-sans-serif}");
    html.push(".flex{display:flex;gap:8px;align-items:center}");
    html.push(".grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}");
    html.push(".table{width:100%;border-collapse:separate;border-spacing:0 8px}");
    html.push(".table th{font:700 12px ui-sans-serif;color:#cbd5e1;text-align:left;padding:4px 6px}");
    html.push(".table td{background:#0b1328;border:1px solid rgba(255,255,255,.06);padding:8px 10px;border-radius:10px;color:#e5e7eb}");
    html.push(".toast{position:fixed;right:16px;bottom:16px;background:#0b1328;border:1px solid rgba(255,255,255,.12);color:#fff;padding:10px 12px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.4);display:none;z-index:9999}");
    html.push(".actions .btn{width:100%}");
    html.push(".hint{font:12px ui-sans-serif;color:var(--muted)}");
    html.push("</style>");

    // ---------- Markup
    html.push("<div class='wrap'>");
    html.push("  <div class='layout'>");

    // Left: Filters & Search
    html.push("    <div class='card'>");
    html.push("      <div class='head'><div class='title'>Filter</div></div>");
    html.push("      <div class='body'>");
    html.push("        <div style='margin-bottom:8px'><input id='q' class='input' placeholder='Search name, email, phone'></div>");
    html.push("        <div class='grid2' style='margin-bottom:8px'>");
    html.push("          <input id='min' class='input' placeholder='Min Balance' type='number'>");
    html.push("          <input id='max' class='input' placeholder='Max Balance' type='number'>");
    html.push("        </div>");
    html.push("        <div class='flex' style='justify-content:space-between'>");
    html.push("          <button id='btnSearch' class='btn'>Search</button>");
    html.push("          <span class='hint'>"+escHtml(runtime.getCurrentUser().name)+"</span>");
    html.push("        </div>");
    html.push("        <hr style='border:none;border-top:1px solid rgba(255,255,255,.06);margin:12px 0'>");
    html.push("        <div class='title' style='font-size:14px;margin-bottom:8px'>Customers</div>");
    html.push("        <div id='list' class='list'></div>");
    html.push("      </div>");
    html.push("    </div>");

    // Middle: Details
    html.push("    <div class='card'>");
    html.push("      <div class='head'><div class='title'>Customer Details</div><div class='pill' id='custStatus'>Select a customer</div></div>");
    html.push("      <div class='body'>");
    html.push("        <div class='kpis' id='kpis'>");
    html.push("          <div class='kpi'><b>Balance</b><div class='v' id='kpiBalance'>—</div></div>");
    html.push("          <div class='kpi'><b>Credit Limit</b><div class='v' id='kpiCredit'>—</div></div>");
    html.push("          <div class='kpi'><b>Open Invoices</b><div class='v' id='kpiInv'>—</div></div>");
    html.push("          <div class='kpi'><b>Unbilled SOs</b><div class='v' id='kpiSO'>—</div></div>");
    html.push("        </div>");

    html.push("        <div style='margin-top:12px' class='grid2'>");
    html.push("          <div>");
    html.push("            <div class='title' style='font-size:14px;margin-bottom:6px'>Profile</div>");
    html.push("            <table class='table'><tbody>");
    html.push("              <tr><th>Name</th><td id='pName'>—</td></tr>");
    html.push("              <tr><th>Email</th><td id='pEmail'>—</td></tr>");
    html.push("              <tr><th>Phone</th><td id='pPhone'>—</td></tr>");
    html.push("              <tr><th>Sales Rep</th><td id='pRep'>—</td></tr>");
    html.push("              <tr><th>Terms</th><td id='pTerms'>—</td></tr>");
    html.push("              <tr><th>Currency</th><td id='pCur'>—</td></tr>");
    html.push("              <tr><th>Created</th><td id='pCreated'>—</td></tr>");
    html.push("            </tbody></table>");
    html.push("          </div>");
    html.push("          <div>");
    html.push("            <div class='title' style='font-size:14px;margin-bottom:6px'>Contacts</div>");
    html.push("            <div id='contacts'></div>");
    html.push("          </div>");
    html.push("        </div>");

    html.push("        <div style='margin-top:12px'>");
    html.push("          <div class='title' style='font-size:14px;margin-bottom:6px'>Recent Transactions</div>");
    html.push("          <div id='tx'></div>");
    html.push("        </div>");

    html.push("        <div style='margin-top:12px'>");
    html.push("          <div class='title' style='font-size:14px;margin-bottom:6px'>Timeline (Tasks & Calls)</div>");
    html.push("          <div id='timeline'></div>");
    html.push("        </div>");

    html.push("      </div>");
    html.push("    </div>");

    // Right: Actions
    html.push("    <div class='card actions'>");
    html.push("      <div class='head'><div class='title'>Quick Actions</div></div>");
    html.push("      <div class='body'>");
    html.push("        <div class='pill' id='selIndicator'>No customer selected</div>");
    html.push("        <div style='height:8px'></div>");
    html.push("        <div><b class='muted'>Log Note</b></div>");
    html.push("        <input id='noteTitle' class='input' placeholder='Note title' style='margin-top:6px'>");
    html.push("        <textarea id='noteBody' class='input' placeholder='Note details' style='margin-top:6px;height:80px'></textarea>");
    html.push("        <button id='btnNote' class='btn' style='margin-top:8px' disabled>Save Note</button>");
    html.push("        <hr style='border:none;border-top:1px solid rgba(255,255,255,.06);margin:12px 0'>");
    html.push("        <div><b class='muted'>Create Task</b></div>");
    html.push("        <input id='taskTitle' class='input' placeholder='Task title' style='margin-top:6px'>");
    html.push("        <input id='taskDue' class='input' type='date' style='margin-top:6px'>");
    html.push("        <textarea id='taskMsg' class='input' placeholder='Task notes' style='margin-top:6px;height:70px'></textarea>");
    html.push("        <button id='btnTask' class='btn' style='margin-top:8px' disabled>Create Task</button>");
    html.push("        <hr style='border:none;border-top:1px solid rgba(255,255,255,.06);margin:12px 0'>");
    html.push("        <div><b class='muted'>Log Call</b></div>");
    html.push("        <input id='callTitle' class='input' placeholder='Call subject' style='margin-top:6px'>");
    html.push("        <input id='callDate' class='input' type='date' style='margin-top:6px'>");
    html.push("        <textarea id='callMsg' class='input' placeholder='Call notes' style='margin-top:6px;height:70px'></textarea>");
    html.push("        <button id='btnCall' class='btn' style='margin-top:8px' disabled>Log Call</button>");
    html.push("        <hr style='border:none;border-top:1px solid rgba(255,255,255,.06);margin:12px 0'>");
    html.push("        <div><b class='muted'>Send Email</b></div>");
    html.push("        <input id='mailSubj' class='input' placeholder='Subject' style='margin-top:6px'>");
    html.push("        <textarea id='mailBody' class='input' placeholder='Message body' style='margin-top:6px;height:100px'></textarea>");
    html.push("        <button id='btnEmail' class='btn' style='margin-top:8px' disabled>Send Email</button>");
    html.push("      </div>");
    html.push("    </div>");

    html.push("  </div></div>");
    html.push("<div id='toast' class='toast'></div>");

    // ---------- Client JS
    html.push("<script>(function(){'use strict';");
    html.push("var api='"+escHtml(slUrl)+"';");
    html.push("var selectedId=null; var loading=false;");
    html.push("function qs(id){return document.getElementById(id);}");

    // Toast
    html.push("function toast(msg){var t=qs('toast');t.textContent=msg;t.style.display='block';setTimeout(function(){t.style.display='none';},2000);}");

    // Render list
    html.push("function renderList(rows){var el=qs('list');el.innerHTML=''; if(!rows||rows.length===0){el.innerHTML='<div class=\"muted\">No results.</div>';return;} for(var i=0;i<rows.length;i++){var r=rows[i];var div=document.createElement('div');div.className='row';div.dataset.id=r.id;var name=esc(r.entityid||('Customer #'+r.id)); var email=esc(r.email||''); var phone=esc(r.phone||''); var bal=esc(r.balance||'0.00'); div.innerHTML='<div><div style=\"font:600 13px ui-sans-serif\">'+name+'</div><div class=\"muted\" style=\"font:12px\">'+email+' '+(phone?(' • '+phone):'')+'</div></div><div class=\"pill\">Bal '+bal+'</div>'; div.addEventListener('click',function(e){selectCustomer(this.dataset.id);}); el.appendChild(div);} }");

    // Render details
    html.push("function setKPIs(d){qs('kpiBalance').textContent=(d.info && d.info.balance!==undefined)?d.info.balance:'—'; qs('kpiCredit').textContent=(d.info && d.info.creditlimit!==undefined)?d.info.creditlimit:'—'; qs('kpiInv').textContent=(d.kpis ? (d.kpis.openInvoices+' / '+Number(d.kpis.openInvoiceAmt||0).toFixed(2)) : '—'); qs('kpiSO').textContent=(d.kpis ? d.kpis.unbilledOrders : '—'); }");
    html.push("function setProfile(d){qs('pName').textContent=d.info? (d.info.name||'—') :'—'; qs('pEmail').textContent=d.info? (d.info.email||'—') :'—'; qs('pPhone').textContent=d.info? (d.info.phone||'—') :'—'; qs('pRep').textContent=d.info? (d.info.salesrep||'—') :'—'; qs('pTerms').textContent=d.info? (d.info.terms||'—') :'—'; qs('pCur').textContent=d.info? (d.info.currency||'—') :'—'; qs('pCreated').textContent=d.info? (d.info.datecreated||'—') :'—'; qs('custStatus').textContent=d.info? (d.info.status||'—') :'—'; qs('selIndicator').textContent=d.info? ('Selected: '+(d.info.name||('Customer #'+selectedId))) : 'No customer selected'; }");
    html.push("function setContacts(list){var c=qs('contacts'); if(!list||list.length===0){c.innerHTML='<div class=\"muted\">No contacts.</div>';return;} var html=''; for(var i=0;i<list.length;i++){var x=list[i]; html += '<div class=\"row\" style=\"cursor:default\"><div><div style=\"font:600 12px ui-sans-serif\">'+esc(x.name||'')+'</div><div class=\"muted\" style=\"font:12px\">'+esc(x.title||'')+'</div></div><div class=\"muted\" style=\"font:12px\">'+esc(x.email||'')+' '+(x.phone?(' • '+esc(x.phone)):'')+'</div></div>'; } c.innerHTML=html; }");
    html.push("function setTx(list){var t=qs('tx'); if(!list||list.length===0){t.innerHTML='<div class=\"muted\">No recent transactions.</div>';return;} var h='<table class=\"table\"><thead><tr><th>Type</th><th>#</th><th>Date</th><th>Status</th><th>Amount</th><th>Remain</th></tr></thead><tbody>'; for(var i=0;i<list.length;i++){var x=list[i]; h+='<tr><td>'+esc(x.type||'')+'</td><td>'+esc(x.tranid||'')+'</td><td>'+esc(x.date||'')+'</td><td>'+esc(x.status||'')+'</td><td>'+esc(x.amount||'')+'</td><td>'+esc(x.remaining||'')+'</td></tr>'; } h+='</tbody></table>'; t.innerHTML=h; }");
    html.push("function setTimeline(tasks,calls){var el=qs('timeline'); var h=''; if(tasks&&tasks.length){h+='<div class=\"muted\" style=\"margin:6px 0\">Tasks</div>'; for(var i=0;i<tasks.length;i++){var x=tasks[i]; h+='<div class=\"row\" style=\"cursor:default\"><div><div style=\"font:600 12px ui-sans-serif\">'+esc(x.title||'Task')+'</div><div class=\"muted\" style=\"font:12px\">Due '+esc(x.duedate||'')+' • '+esc(x.status||'')+'</div></div><div class=\"muted\" style=\"font:12px\">'+esc(x.owner||'')+'</div></div>'; }} if(calls&&calls.length){h+='<div class=\"muted\" style=\"margin:6px 0\">Calls</div>'; for(i=0;i<calls.length;i++){var y=calls[i]; h+='<div class=\"row\" style=\"cursor:default\"><div><div style=\"font:600 12px ui-sans-serif\">'+esc(y.title||'Call')+'</div><div class=\"muted\" style=\"font:12px\">'+esc(y.date||'')+' • '+esc(y.status||'')+'</div></div><div class=\"muted\" style=\"font:12px\">'+(y.message?esc(y.message).slice(0,60)+'…':'')+'</div></div>'; }} if(!h){h='<div class=\"muted\">No recent activity.</div>'; } el.innerHTML=h; }");

    // HTML escape for client
    html.push("function esc(s){if(s===null||s===undefined) return ''; s=String(s); return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;');}");

    // API calls
    html.push("function postJSON(payload, cb){ var xhr=new XMLHttpRequest(); xhr.open('POST', api, true); xhr.setRequestHeader('Content-Type','application/json'); xhr.onreadystatechange=function(){ if(xhr.readyState===4){ try{ var data=JSON.parse(xhr.responseText||'{}'); cb(null,data); }catch(e){ cb(new Error('Bad JSON'), null); } } }; xhr.send(JSON.stringify(payload)); }");

    // Search handler
    html.push("function doSearch(){ if(loading) return; loading=true; qs('btnSearch').disabled=true; var payload={ action:'search', q:qs('q').value, min:qs('min').value, max:qs('max').value, page:1 }; postJSON(payload,function(err,res){ loading=false; qs('btnSearch').disabled=false; if(err||!res||!res.ok){ toast('Search failed'); return; } renderList(res.rows||[]); }); }");

    // Select customer
    html.push("function selectCustomer(id){ selectedId=id; setActionButtons(true); postJSON({action:'get', customerId:id}, function(err,res){ if(err||!res||!res.ok){ toast('Load failed'); return; } setKPIs(res); setProfile(res); setContacts(res.contacts||[]); setTx(res.transactions||[]); setTimeline(res.tasks||[], res.calls||[]); toast('Loaded'); }); }");

    // Action buttons enable
    html.push("function setActionButtons(enable){ qs('btnNote').disabled=!enable; qs('btnTask').disabled=!enable; qs('btnCall').disabled=!enable; qs('btnEmail').disabled=!enable; }");

    // Actions
    html.push("qs('btnNote').addEventListener('click',function(){ if(!selectedId) return; var t=qs('noteTitle').value||'Note'; var b=qs('noteBody').value||''; postJSON({action:'addnote',customerId:selectedId,title:t,body:b},function(e,res){ if(res&&res.ok){ toast('Note saved'); qs('noteTitle').value=''; qs('noteBody').value=''; } else { toast('Note failed'); } }); });");
    html.push("qs('btnTask').addEventListener('click',function(){ if(!selectedId) return; var t=qs('taskTitle').value||'Task'; var d=qs('taskDue').value||''; var m=qs('taskMsg').value||''; postJSON({action:'addtask',customerId:selectedId,title:t,dueDate:d,message:m},function(e,res){ if(res&&res.ok){ toast('Task created'); qs('taskTitle').value=''; qs('taskDue').value=''; qs('taskMsg').value=''; } else { toast('Task failed'); } }); });");
    html.push("qs('btnCall').addEventListener('click',function(){ if(!selectedId) return; var t=qs('callTitle').value||'Call'; var d=qs('callDate').value||''; var m=qs('callMsg').value||''; postJSON({action:'logcall',customerId:selectedId,title:t,startDate:d,message:m},function(e,res){ if(res&&res.ok){ toast('Call logged'); qs('callTitle').value=''; qs('callDate').value=''; qs('callMsg').value=''; } else { toast('Call failed'); } }); });");
    html.push("qs('btnEmail').addEventListener('click',function(){ if(!selectedId) return; var s=qs('mailSubj').value||'Hello'; var b=qs('mailBody').value||''; postJSON({action:'sendemail',customerId:selectedId,subject:s,body:b},function(e,res){ if(res&&res.ok){ toast('Email sent'); } else { toast(res&&res.message?res.message:'Email failed'); } }); });");

    // Wire search
    html.push("qs('btnSearch').addEventListener('click',doSearch);");
    html.push("qs('q').addEventListener('keydown',function(e){ if(e.key==='Enter'){ doSearch(); }});");

    // Boot
    html.push("setActionButtons(false); doSearch();");
    html.push("})();</script>");

    var fld = form.addField({ id:'custpage_html', type: serverWidget.FieldType.INLINEHTML, label: 'ui' });
    fld.defaultValue = html.join('');

    context.response.writePage(form);
  }

  // ------------------------ Entry ------------------------
  function onRequest(context){
    if(context.request.method === 'POST'){ return handlePost(context); }
    return handleGet(context);
  }

  return { onRequest: onRequest };
});
