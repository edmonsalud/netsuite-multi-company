#!/usr/bin/env bash
#
# Import from Specific Company Script
#
# USAGE:
#   ./scripts/import-from-company.sh [COMPANY-NAME] [TYPE]
#
# EXAMPLES:
#   ./scripts/import-from-company.sh HMP-Global objects
#   ./scripts/import-from-company.sh ABA-CON files
#   ./scripts/import-from-company.sh HBNO all
#
# DESCRIPTION:
#   - Imports objects/files from NetSuite to local project
#   - TYPE options: objects, files, all
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
    echo "Usage: $0 [COMPANY-NAME] [TYPE]"
    echo "  TYPE: objects | files | all (default: all)"
    echo ""
    echo "Available companies:"
    ls -1 companies/ | sed 's/^/  - /'
    exit 1
fi

COMPANY=$1
TYPE=${2:-all}
COMPANY_DIR="companies/$COMPANY"

# Check if company directory exists
if [ ! -d "$COMPANY_DIR" ]; then
    echo -e "${RED}Error: Company '$COMPANY' not found${NC}"
    echo ""
    echo "Available companies:"
    ls -1 companies/ | sed 's/^/  - /'
    exit 1
fi

# Validate import type
if [[ ! "$TYPE" =~ ^(objects|files|all)$ ]]; then
    echo -e "${RED}Error: Invalid import type '$TYPE'${NC}"
    echo "Valid types: objects, files, all"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Importing from $COMPANY${NC}"
echo -e "${BLUE}Type: $TYPE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Navigate to company directory
cd "$COMPANY_DIR"

# Import based on type
if [[ "$TYPE" == "objects" || "$TYPE" == "all" ]]; then
    echo -e "${YELLOW}Importing objects...${NC}"
    npx suitecloud object:import
    echo -e "${GREEN}✓ Objects imported${NC}"
    echo ""
fi

if [[ "$TYPE" == "files" || "$TYPE" == "all" ]]; then
    echo -e "${YELLOW}Importing files...${NC}"
    npx suitecloud file:import
    echo -e "${GREEN}✓ Files imported${NC}"
    echo ""
fi

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Import Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Company: ${BLUE}$COMPANY${NC}"
echo -e "Type: ${BLUE}$TYPE${NC}"
echo -e "Status: ${GREEN}✓ SUCCESS${NC}"
echo ""

# Return to root directory
cd ../..

exit 0
