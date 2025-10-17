/**
 * SuiteCloud CLI Configuration - Standard Template
 *
 * This is the MASTER configuration template for all company projects.
 *
 * USAGE:
 * - Copy this file to companies/[COMPANY-NAME]/suitecloud.config.js
 * - Update projectName if needed
 * - DO NOT modify the excludefiles patterns unless necessary
 *
 * AUTHENTICATION:
 * - This file does NOT contain authentication credentials
 * - Authentication is stored separately in:
 *   - project.json (auth ID reference)
 *   - C:\Users\Ed\AppData\Local\.suitecloud-sdk\ (encrypted tokens)
 */

module.exports = {
    defaultProjectFolder: "src",

    commands: {
        /**
         * Deploy Command Configuration
         *
         * Excludes common development files from deployment to NetSuite:
         * - Version control files (.git, .gitignore)
         * - Dependency directories (node_modules)
         * - Package management files (package.json, package-lock.json)
         * - Log files (*.log)
         * - Test directories and files
         * - Backup files (*.bak, *.backup)
         * - NetSuite attribute files (.attributes)
         */
        deploy: {
            args: {
                excludefiles: [
                    // Version Control
                    "**/.git/**",
                    "**/.gitignore",

                    // Dependencies
                    "**/node_modules/**",

                    // Package Management
                    "**/package.json",
                    "**/package-lock.json",

                    // Logs & Temporary Files
                    "**/*.log",
                    "**/*.tmp",
                    "**/*.bak",
                    "**/*.backup",
                    "**/~*",

                    // Test Files
                    "**/test/**",
                    "**/tests/**",
                    "**/__tests__/**",
                    "**/*.test.js",
                    "**/*.spec.js",

                    // NetSuite Metadata
                    "**/.attributes/**",

                    // Documentation (deployed separately if needed)
                    "**/*.md",
                    "**/*.html",

                    // Backup & Version Scripts
                    "**/*_ORIGINAL_BACKUP.js",
                    "**/*_PRODUCTION.js",
                    "**/*_DEBUG.js",
                    "**/*_backup.js",

                    // IDE & System Files
                    "**/.vscode/**",
                    "**/.idea/**",
                    "**/Thumbs.db",
                    "**/.DS_Store"
                ]
            }
        },

        /**
         * Validate Command Configuration
         * (Add custom validation settings here if needed)
         */
        validate: {
            // Custom validation settings
        },

        /**
         * Import Command Configuration
         * (Add custom import settings here if needed)
         */
        import: {
            // Custom import settings
        }
    }
};
