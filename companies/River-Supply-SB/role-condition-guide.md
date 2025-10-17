# Adding Role-Based Condition to Workflows

The Set Display Type action has been added, but we need to configure it in the NetSuite UI to only apply to non-Administrators.

## Steps to Add Role Condition:

### For Estimate Workflow:
1. Log into NetSuite
2. Go to: Customization → Workflow → Workflows
3. Open: "Auto-Set Sales Rep - Estimate"
4. Click on the state: "Populate Sales Rep"
5. Find the action: "workflowaction_disable_salesrep"
6. Click Edit on that action
7. Add Condition:
   - Click "Set Up" next to "Condition"
   - Type: User Role
   - Current User Role
   - Operator: is not any of
   - Select: Administrator
   - Save
8. Save the workflow

### For Sales Order Workflow:
Repeat the same steps for "Auto-Set Sales Rep - Sales Order" workflow.

This ensures only non-Administrator users see the disabled field.
