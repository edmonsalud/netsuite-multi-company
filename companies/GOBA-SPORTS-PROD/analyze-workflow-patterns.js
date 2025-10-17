/**
 * Analyze GOBA-SPORTS-PROD Workflow Patterns
 *
 * Since we can't query workflow metadata directly, this script analyzes
 * the workflow script IDs to identify patterns, record types, and purposes
 */

const fs = require('fs');

// All 237 workflows from the CLI listing
const workflows = [
  'customworkflow100', 'customworkflow100_2', 'customworkflow101', 'customworkflow102',
  'customworkflow103', 'customworkflow103_2', 'customworkflow104', 'customworkflow105',
  'customworkflow106', 'customworkflow107', 'customworkflow108', 'customworkflow109',
  'customworkflow110', 'customworkflow111', 'customworkflow112', 'customworkflow113',
  'customworkflow114', 'customworkflow115', 'customworkflow116', 'customworkflow117',
  'customworkflow117_2', 'customworkflow118', 'customworkflow119', 'customworkflow120',
  'customworkflow121', 'customworkflow122', 'customworkflow123', 'customworkflow124',
  'customworkflow125', 'customworkflow126', 'customworkflow127', 'customworkflow127_2',
  'customworkflow127_3', 'customworkflow128', 'customworkflow129', 'customworkflow130',
  'customworkflow131', 'customworkflow132', 'customworkflow133', 'customworkflow134',
  'customworkflow135', 'customworkflow136', 'customworkflow137', 'customworkflow138',
  'customworkflow139', 'customworkflow140', 'customworkflow141', 'customworkflow142',
  'customworkflow143', 'customworkflow144', 'customworkflow145', 'customworkflow146',
  'customworkflow147', 'customworkflow151', 'customworkflow155', 'customworkflow156',
  'customworkflow157', 'customworkflow158', 'customworkflow160', 'customworkflow161',
  'customworkflow162', 'customworkflow163', 'customworkflow164', 'customworkflow61',
  'customworkflow62', 'customworkflow62_2', 'customworkflow63', 'customworkflow64',
  'customworkflow66', 'customworkflow67', 'customworkflow68', 'customworkflow69',
  'customworkflow70', 'customworkflow70_2', 'customworkflow70_2_2', 'customworkflow70_2_3',
  'customworkflow71', 'customworkflow72', 'customworkflow73', 'customworkflow74',
  'customworkflow75', 'customworkflow76', 'customworkflow76_2', 'customworkflow76_3',
  'customworkflow77', 'customworkflow78', 'customworkflow79', 'customworkflow79_2',
  'customworkflow79_3', 'customworkflow80', 'customworkflow82', 'customworkflow83',
  'customworkflow84', 'customworkflow85', 'customworkflow86', 'customworkflow87',
  'customworkflow88', 'customworkflow89', 'customworkflow90', 'customworkflow91',
  'customworkflow92', 'customworkflow93', 'customworkflow94', 'customworkflow95',
  'customworkflow96', 'customworkflow97', 'customworkflow98', 'customworkflow99',
  'customworkflow_2663_update_batch', 'customworkflow_8299_lock_cat_record',
  'customworkflow_alert_user_message', 'customworkflow_assemblies_department',
  'customworkflow_au_product_review', 'customworkflow_billing_invoice_autoreply',
  'customworkflow_call_default', 'customworkflow_call_default_2',
  'customworkflow_call_new_default', 'customworkflow_call_new_default_2',
  'customworkflow_campaign_end_date', 'customworkflow_campaign_new_default',
  'customworkflow_campaigntotal', 'customworkflow_case_general_default',
  'customworkflow_case_helpdesk_default', 'customworkflow_case_new_general_default',
  'customworkflow_case_new_helpdesk_default', 'customworkflow_case_subcase',
  'customworkflow_case_warranty_regi', 'customworkflow_case_warranty_report',
  'customworkflow_case_warranty_report_tgom', 'customworkflow_cr_defaults',
  'customworkflow_cust_default', 'customworkflow_cust_dup_updatebc',
  'customworkflow_cust_gss_status_resync_sp', 'customworkflow_cust_new_send_survey',
  'customworkflow_cust_original_campaign', 'customworkflow_cust_price_level',
  'customworkflow_cust_resync_sp', 'customworkflow_cust_sales_readiness',
  'customworkflow_cust_update_bc', 'customworkflow_cust_update_dept',
  'customworkflow_cust_update_info', 'customworkflow_cust_update_mcs_gss',
  'customworkflow_cust_update_phone', 'customworkflow_cust_update_phone_mobile',
  'customworkflow_custeventdefault', 'customworkflow_custom_order_updates',
  'customworkflow_dealer_fulfillment', 'customworkflow_defect_set_default',
  'customworkflow_deposit_new_default', 'customworkflow_depositevents',
  'customworkflow_edi_default', 'customworkflow_emailtracking',
  'customworkflow_emailupdate', 'customworkflow_emp_default',
  'customworkflow_estimate_disable_rep', 'customworkflow_event_new_default',
  'customworkflow_filteredcampaignupdate', 'customworkflow_go_to_record',
  'customworkflow_gs_3rd_party_service_item', 'customworkflow_gs_disabled_customer_fld',
  'customworkflow_gs_send_email_es_creation', 'customworkflow_gs_set_tran_sub_based_frm',
  'customworkflow_gs_so_auto_iff_phone_2', 'customworkflow_gs_so_auto_iff_phone_3',
  'customworkflow_gs_so_auto_iff_phone_ord', 'customworkflow_gym_sponsor',
  'customworkflow_ic_remove_buttons', 'customworkflow_if_credit',
  'customworkflow_if_default', 'customworkflow_if_upd_pp',
  'customworkflow_iflock', 'customworkflow_inv_upd_if',
  'customworkflow_is_default', 'customworkflow_itematp_inactive',
  'customworkflow_journal_default', 'customworkflow_layby_new_default',
  'customworkflow_marktracksent', 'customworkflow_ns_ps_meeting_note_delive',
  'customworkflow_ns_testissue_new_default', 'customworkflow_ns_ts_test_issue_workflow',
  'customworkflow_online_lead_pros_default', 'customworkflow_online_new_lead_default',
  'customworkflow_online_new_warranty_defau', 'customworkflow_pay_memo',
  'customworkflow_pc_restrict', 'customworkflow_phone_opt_in_update',
  'customworkflow_phonedirection', 'customworkflow_promo_disable_expired',
  'customworkflow_pros_new_send_brochure', 'customworkflow_ref_cc_name',
  'customworkflow_ref_def_acct', 'customworkflow_rmp_cust_create_default',
  'customworkflow_rmp_ship_info', 'customworkflow_rmp_ship_method',
  'customworkflow_rmp_so_approval', 'customworkflow_rmp_so_defaults',
  'customworkflow_rmp_so_view_onhold', 'customworkflow_routing_graphic_request',
  'customworkflow_so_address_fields', 'customworkflow_so_credit_hold',
  'customworkflow_so_credit_hold_sft', 'customworkflow_so_dealer_status',
  'customworkflow_so_defaults', 'customworkflow_so_dept_change',
  'customworkflow_so_dept_update', 'customworkflow_so_dept_update_2',
  'customworkflow_so_disabless', 'customworkflow_so_if_billaddress',
  'customworkflow_so_location_change', 'customworkflow_so_modified_shopifyorders',
  'customworkflow_so_new_csv_import', 'customworkflow_so_new_default',
  'customworkflow_so_tramp_commit', 'customworkflow_so_upd_dept',
  'customworkflow_so_warning', 'customworkflow_soeventsdefault',
  'customworkflow_soeventsdefault_2', 'customworkflow_soremovefulfill',
  'customworkflow_tgoma_default', 'customworkflow_tran_exch_rate',
  'customworkflow_trans_default', 'customworkflow_trans_update_campaig_2',
  'customworkflow_trans_update_campaign', 'customworkflow_update_customer_facing',
  'customworkflow_update_if', 'customworkflow_update_mcr',
  'customworkflow_us_bilt_email', 'customworkflow_us_dealer_install_cancel',
  'customworkflow_us_dealer_installations', 'customworkflow_vt_new_default',
  'customworkflow_webstore_new_acc_guest', 'customworkflow_webstore_new_account',
  'customworkflow_webstore_new_cust_default', 'customworkflow_webstore_new_deposit',
  'customworkflow_webstore_new_layby_reply', 'customworkflow_webstore_new_so_default',
  'customworkflow_webstore_new_so_reply'
];

console.log('\n🔍 Analyzing GOBA-SPORTS-PROD Workflow Patterns\n');
console.log('='.repeat(80));
console.log(`Total Workflows: ${workflows.length}`);
console.log('='.repeat(80));
console.log('');

// Categorize by patterns
const categories = {
  numbered: [],          // customworkflow\d+
  customer: [],          // cust_, customer_
  salesOrder: [],        // so_, salesorder_
  case: [],              // case_
  campaign: [],          // campaign_
  call: [],              // call_
  invoice: [],           // if_, invoice_
  webstore: [],          // webstore_
  email: [],             // email_
  transaction: [],       // trans_, tran_
  employee: [],          // emp_
  dealer: [],            // dealer_
  warranty: [],          // warranty_
  rmp: [],               // rmp_ (RMP integration?)
  gobasports: [],        // gs_ (GOBA Sports specific)
  deposit: [],           // deposit_
  event: [],             // event_
  other: []
};

workflows.forEach(wf => {
  if (/^customworkflow\d+(_\d+)?$/.test(wf)) {
    categories.numbered.push(wf);
  } else if (/cust_|customer_/.test(wf)) {
    categories.customer.push(wf);
  } else if (/_so_|salesorder/.test(wf)) {
    categories.salesOrder.push(wf);
  } else if (/case_/.test(wf)) {
    categories.case.push(wf);
  } else if (/campaign/.test(wf)) {
    categories.campaign.push(wf);
  } else if (/call_/.test(wf)) {
    categories.call.push(wf);
  } else if (/_if_|invoice/.test(wf)) {
    categories.invoice.push(wf);
  } else if (/webstore/.test(wf)) {
    categories.webstore.push(wf);
  } else if (/email/.test(wf)) {
    categories.email.push(wf);
  } else if (/trans_|tran_/.test(wf)) {
    categories.transaction.push(wf);
  } else if (/emp_/.test(wf)) {
    categories.employee.push(wf);
  } else if (/dealer/.test(wf)) {
    categories.dealer.push(wf);
  } else if (/warranty/.test(wf)) {
    categories.warranty.push(wf);
  } else if (/rmp_/.test(wf)) {
    categories.rmp.push(wf);
  } else if (/_gs_/.test(wf)) {
    categories.gobasports.push(wf);
  } else if (/deposit/.test(wf)) {
    categories.deposit.push(wf);
  } else if (/event/.test(wf)) {
    categories.event.push(wf);
  } else {
    categories.other.push(wf);
  }
});

console.log('📊 WORKFLOW CATEGORIES BY RECORD TYPE\n');
console.log('-'.repeat(80));

Object.entries(categories)
  .filter(([_, wfs]) => wfs.length > 0)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([category, wfs]) => {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    console.log(`\n${categoryName} (${wfs.length} workflows):`);
    wfs.forEach(wf => {
      console.log(`  • ${wf}`);
    });
  });

// Identify key patterns
console.log('\n\n📈 KEY INSIGHTS\n');
console.log('='.repeat(80));

// Pattern analysis
const patterns = {
  defaults: workflows.filter(w => w.includes('default')),
  updates: workflows.filter(w => w.includes('update')),
  news: workflows.filter(w => w.includes('new')),
  emails: workflows.filter(w => w.includes('email') || w.includes('send')),
  locks: workflows.filter(w => w.includes('lock')),
  approvals: workflows.filter(w => w.includes('approval')),
  credit: workflows.filter(w => w.includes('credit')),
  shopify: workflows.filter(w => w.includes('shopify')),
  integrations: workflows.filter(w => w.includes('gs_') || w.includes('rmp_') || w.includes('au_'))
};

console.log(`\n1. DEFAULT WORKFLOWS (${patterns.defaults.length})`);
console.log('   Purpose: Set default field values on record creation/update');
console.log('   Examples:', patterns.defaults.slice(0, 3).join(', '));

console.log(`\n2. UPDATE WORKFLOWS (${patterns.updates.length})`);
console.log('   Purpose: Modify field values based on conditions');
console.log('   Examples:', patterns.updates.slice(0, 3).join(', '));

console.log(`\n3. NEW RECORD WORKFLOWS (${patterns.news.length})`);
console.log('   Purpose: Initialize new records with specific logic');
console.log('   Examples:', patterns.news.slice(0, 3).join(', '));

console.log(`\n4. EMAIL/NOTIFICATION WORKFLOWS (${patterns.emails.length})`);
console.log('   Purpose: Send automated emails or notifications');
console.log('   Examples:', patterns.emails.slice(0, 3).join(', '));

console.log(`\n5. INTEGRATION WORKFLOWS (${patterns.integrations.length})`);
console.log('   Purpose: Integration with external systems (Shopify, RMP, AU, etc.)');
console.log('   Examples:', patterns.integrations.slice(0, 5).join(', '));

if (patterns.credit.length > 0) {
  console.log(`\n6. CREDIT WORKFLOWS (${patterns.credit.length})`);
  console.log('   Purpose: Credit hold management and credit limit checks');
  console.log('   Examples:', patterns.credit.join(', '));
}

if (patterns.shopify.length > 0) {
  console.log(`\n7. SHOPIFY INTEGRATION (${patterns.shopify.length})`);
  console.log('   Purpose: Shopify e-commerce integration');
  console.log('   Examples:', patterns.shopify.join(', '));
}

// Analyze duplicates/versions
const duplicates = workflows.filter(w => /_2$|_3$/.test(w));
console.log(`\n8. DUPLICATE/VERSION WORKFLOWS (${duplicates.length})`);
console.log('   Purpose: Multiple versions of same workflow (testing, A/B, or revisions)');
console.log('   Examples:', duplicates.slice(0, 5).join(', '));

// Save to CSV
const csvLines = ['Category,Script ID,Inferred Purpose,Priority'];
Object.entries(categories).forEach(([category, wfs]) => {
  wfs.forEach(wf => {
    let purpose = '';
    if (wf.includes('default')) purpose = 'Set default values';
    else if (wf.includes('update')) purpose = 'Update field values';
    else if (wf.includes('new')) purpose = 'Initialize new records';
    else if (wf.includes('email') || wf.includes('send')) purpose = 'Send notifications';
    else if (wf.includes('lock')) purpose = 'Lock/restrict records';
    else if (wf.includes('credit')) purpose = 'Credit management';
    else purpose = 'Business logic automation';

    const priority = wf.includes('so_') || wf.includes('cust_') ? 'High' : 'Medium';
    csvLines.push(`${category},"${wf}","${purpose}",${priority}`);
  });
});

fs.writeFileSync('goba-workflows-analysis.csv', csvLines.join('\n'));
console.log('\n\n💾 Analysis saved to: goba-workflows-analysis.csv');
console.log('');
