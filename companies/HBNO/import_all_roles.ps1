# Import all roles from HBNO account
$roles = @(
    "customrole1000", "customrole1001", "customrole1001_3", "customrole1002", "customrole1240",
    "customrole1347", "customrole1349", "customrole1351", "customrole1353", "customrole1354",
    "customrole1455", "customrole1456", "customrole1762", "customrole1763", "customrole1768",
    "customrole1780", "customrole1781", "customrole1782", "customrole1782_2", "customrole1786",
    "customrole1789", "customrole1790", "customrole1791", "customrole1792", "customrole1793",
    "customrole1794", "customrole1795", "customrole1796", "customrole1797", "customrole1800",
    "customrole1802", "customrole2003", "customrole2003_2", "customrole2004", "customrole2005",
    "customrole2006", "customrole2007", "customrole2109", "customrole2110", "customrole2112",
    "customrole_atlas_mf_em_production", "customrole_atlas_mfg_em_acct", "customrole_atlas_mfg_em_cfo",
    "customrole_atlas_mfg_em_contract_mfg", "customrole_atlas_mfg_em_controller", "customrole_atlas_mfg_em_customer_service",
    "customrole_atlas_mfg_em_marketing_mgr", "customrole_atlas_mfg_em_purchasing_mgr", "customrole_atlas_mfg_em_sales",
    "customrole_atlas_mfg_em_sales_mgr", "customrole_atlas_mfg_em_senior_exec", "customrole_atlas_mfg_em_suply_chain_mgr",
    "customrole_atlas_mfg_em_whse_mgr", "customrole_ccp_gateway_admin", "customrole_dt_file_path_admin_role",
    "customrole_ep_approver", "customrole_ep_configurator", "customrole_ep_processor",
    "customrole_esc_sales_admin", "customrole_esc_sales_manager", "customrole_esc_sales_publisher",
    "customrole_esc_sales_rep", "customrole_hbno_mf_em_production", "customrole_hbno_mfg_em_acct",
    "customrole_hbno_mfg_em_cfo", "customrole_hbno_mfg_em_contract_mfg", "customrole_hbno_mfg_em_controller",
    "customrole_hbno_mfg_em_customer_service", "customrole_hbno_mfg_em_marketing_mgr", "customrole_hbno_mfg_em_purchasing_mgr",
    "customrole_hbno_mfg_em_sales", "customrole_hbno_mfg_em_sales_mgr", "customrole_hbno_mfg_em_senior_exec",
    "customrole_hbno_mfg_em_suply_chain_mgr", "customrole_hbno_mfg_em_whse_mgr", "customrole_hbno_senior_developer",
    "customrole_hbno_wms_material_handler", "customrole_hbno_wms_warehouse_manager_na", "customrole_jpmc_minimal_role",
    "customrole_lot_sn_role", "customrole_mfgmob_productionmanager", "customrole_mfgmob_productionoperator",
    "customrole_mobile_administrator", "customrole_ncfar", "customrole_netstock_consultant",
    "customrole_netstock_integration", "customrole_netsuite_dev_team", "customrole_ns_ps_implementation_team",
    "customrole_packingadmin", "customrole_packship_packer", "customrole_qm_administrator",
    "customrole_qm_engineer", "customrole_qm_manager", "customrole_shipcentralmanager",
    "customrole_shipcentraloperator", "customrole_shipcentralpackingoperator", "customrole_shipcentralshippingoperator",
    "customrole_srpamazonuser", "customrole_translation_script_admin", "customrole_webserviceadmin",
    "customrole_wmsse_in_mngr", "customrole_wmsse_in_op", "customrole_wmsse_mobile",
    "customrole_wmsse_out_mngr", "customrole_wmsse_out_op", "customrole_wmsse_warehouse",
    "customrole_wmsse_warehousemanager", "customrole_wmsse_wh_administrator", "customrole_wmsse_wh_operator",
    "customrole_wmsse_wms_inv_manager", "customroletestinventory"
)

$successCount = 0
$failCount = 0
$lockedCount = 0
$total = $roles.Count

Write-Host "Importing $total roles from HBNO account..." -ForegroundColor Cyan
Write-Host ""

$i = 0
foreach ($role in $roles) {
    $i++
    Write-Host "[$i/$total] Importing $role..." -NoNewline

    $output = npx suitecloud object:import --type role --scriptid $role --destinationfolder /Objects 2>&1 | Out-String

    if ($output -match "locked") {
        Write-Host " LOCKED" -ForegroundColor Yellow
        $lockedCount++
    }
    elseif ($output -match "failed" -or $output -match "error") {
        Write-Host " FAILED" -ForegroundColor Red
        $failCount++
    }
    else {
        Write-Host " SUCCESS" -ForegroundColor Green
        $successCount++
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Import Summary:" -ForegroundColor Cyan
Write-Host "  Total roles: $total" -ForegroundColor White
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Locked: $lockedCount" -ForegroundColor Yellow
Write-Host "  Failed: $failCount" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Cyan
