#!/usr/bin/env bash
#
# Deployment Status Dashboard Script
#
# USAGE:
#   ./scripts/deployment-status.sh
#
# DESCRIPTION:
#   - Shows deployment status for all companies
#   - Counts scripts and objects per company
#   - Shows validation status
#   - Provides deployment readiness report
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          NetSuite Multi-Company Deployment Dashboard          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Generated: $(date)${NC}"
echo ""

# Function to count files in a directory
count_files() {
    local dir=$1
    if [ -d "$dir" ]; then
        find "$dir" -type f -name "*.js" 2>/dev/null | wc -l
    else
        echo "0"
    fi
}

# Function to count XML objects
count_objects() {
    local dir=$1
    if [ -d "$dir" ]; then
        find "$dir" -type f -name "*.xml" 2>/dev/null | wc -l
    else
        echo "0"
    fi
}

# Function to get file size
get_size() {
    local dir=$1
    if [ -d "$dir" ]; then
        du -sh "$dir" 2>/dev/null | cut -f1
    else
        echo "0B"
    fi
}

# Function to check validation status
check_validation() {
    local company_dir=$1
    cd "$company_dir"
    if npx suitecloud project:validate > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Valid${NC}"
    else
        echo -e "${RED}✗ Invalid${NC}"
    fi
    cd - > /dev/null
}

# Header
printf "${YELLOW}%-25s${NC} ${CYAN}%10s${NC} ${CYAN}%10s${NC} ${CYAN}%10s${NC} ${CYAN}%15s${NC}\n" \
    "Company" "Scripts" "Objects" "Size" "Validation"
echo "────────────────────────────────────────────────────────────────────────────"

# Loop through all company directories
for COMPANY_DIR in companies/*/; do
    COMPANY=$(basename "$COMPANY_DIR")

    # Count scripts
    SCRIPT_COUNT=$(count_files "$COMPANY_DIR/src/FileCabinet/SuiteScripts")

    # Count objects
    OBJECT_COUNT=$(count_objects "$COMPANY_DIR/src/Objects")

    # Get size
    SIZE=$(get_size "$COMPANY_DIR/src/FileCabinet/SuiteScripts")

    # Check validation (disable for speed in large projects)
    # VALIDATION=$(check_validation "$COMPANY_DIR")
    VALIDATION="${CYAN}Skipped${NC}"

    # Print row
    printf "%-25s %10s %10s %10s %15b\n" \
        "$COMPANY" "$SCRIPT_COUNT" "$OBJECT_COUNT" "$SIZE" "$VALIDATION"
done

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Summary statistics
TOTAL_COMPANIES=$(ls -1 companies/ | wc -l)
TOTAL_SCRIPTS=$(find companies/*/src/FileCabinet/SuiteScripts -name "*.js" 2>/dev/null | wc -l)
TOTAL_OBJECTS=$(find companies/*/src/Objects -name "*.xml" 2>/dev/null | wc -l)

echo -e "${GREEN}Summary:${NC}"
echo -e "  Total Companies: ${BLUE}$TOTAL_COMPANIES${NC}"
echo -e "  Total Scripts:   ${BLUE}$TOTAL_SCRIPTS${NC}"
echo -e "  Total Objects:   ${BLUE}$TOTAL_OBJECTS${NC}"
echo ""

# Quick actions
echo -e "${YELLOW}Quick Actions:${NC}"
echo -e "  Deploy to company:   ${CYAN}./scripts/deploy-to-company.sh [COMPANY]${NC}"
echo -e "  Validate all:        ${CYAN}./scripts/validate-all-companies.sh${NC}"
echo -e "  Import from company: ${CYAN}./scripts/import-from-company.sh [COMPANY] [TYPE]${NC}"
echo ""
