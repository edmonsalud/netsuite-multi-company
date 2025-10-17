#!/usr/bin/env bash
#
# Validate All Companies Script
#
# USAGE:
#   ./scripts/validate-all-companies.sh
#
# DESCRIPTION:
#   - Validates all company projects
#   - Reports which companies are deployment-ready
#   - Identifies issues across companies
#

set +e  # Don't exit on error (we want to check all companies)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validating All Companies${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Arrays to track results
declare -a VALID_COMPANIES
declare -a INVALID_COMPANIES

# Loop through all company directories
for COMPANY_DIR in companies/*/; do
    COMPANY=$(basename "$COMPANY_DIR")

    echo -e "${YELLOW}Validating $COMPANY...${NC}"

    # Navigate to company directory
    cd "$COMPANY_DIR"

    # Run validation
    if npx suitecloud project:validate > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $COMPANY - VALID${NC}"
        VALID_COMPANIES+=("$COMPANY")
    else
        echo -e "${RED}✗ $COMPANY - INVALID${NC}"
        INVALID_COMPANIES+=("$COMPANY")
    fi

    # Return to root
    cd ../..
    echo ""
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${GREEN}Valid Companies (${#VALID_COMPANIES[@]}):${NC}"
for COMPANY in "${VALID_COMPANIES[@]}"; do
    echo -e "  ${GREEN}✓${NC} $COMPANY"
done
echo ""

echo -e "${RED}Invalid Companies (${#INVALID_COMPANIES[@]}):${NC}"
for COMPANY in "${INVALID_COMPANIES[@]}"; do
    echo -e "  ${RED}✗${NC} $COMPANY"
done
echo ""

# Exit status
if [ ${#INVALID_COMPANIES[@]} -eq 0 ]; then
    echo -e "${GREEN}All companies are valid and deployment-ready!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some companies have validation issues - please review${NC}"
    exit 1
fi
