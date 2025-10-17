#!/usr/bin/env bash
#
# Deploy to Specific Company Script
#
# USAGE:
#   ./scripts/deploy-to-company.sh [COMPANY-NAME]
#
# EXAMPLES:
#   ./scripts/deploy-to-company.sh HMP-Global
#   ./scripts/deploy-to-company.sh ABA-CON
#
# DESCRIPTION:
#   - Navigates to company folder
#   - Runs pre-deployment validation
#   - Deploys to NetSuite
#   - Reports success/failure
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if company name provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Company name required${NC}"
    echo ""
    echo "Usage: $0 [COMPANY-NAME]"
    echo ""
    echo "Available companies:"
    ls -1 companies/ | sed 's/^/  - /'
    exit 1
fi

COMPANY=$1
COMPANY_DIR="companies/$COMPANY"

# Check if company directory exists
if [ ! -d "$COMPANY_DIR" ]; then
    echo -e "${RED}Error: Company '$COMPANY' not found${NC}"
    echo ""
    echo "Available companies:"
    ls -1 companies/ | sed 's/^/  - /'
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deploying to $COMPANY${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Navigate to company directory
cd "$COMPANY_DIR"

# Step 1: Validate project
echo -e "${YELLOW}Step 1/3: Validating project...${NC}"
if npx suitecloud project:validate; then
    echo -e "${GREEN}✓ Validation successful${NC}"
    echo ""
else
    echo -e "${RED}✗ Validation failed${NC}"
    echo -e "${RED}Please fix validation errors before deploying${NC}"
    exit 1
fi

# Step 2: Deploy
echo -e "${YELLOW}Step 2/3: Deploying to NetSuite...${NC}"
if npx suitecloud project:deploy; then
    echo -e "${GREEN}✓ Deployment successful${NC}"
    echo ""
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

# Step 3: Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Company: ${BLUE}$COMPANY${NC}"
echo -e "Status: ${GREEN}✓ SUCCESS${NC}"
echo -e "Date: $(date)"
echo ""

# Return to root directory
cd ../..

exit 0
