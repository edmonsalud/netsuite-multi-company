module.exports = {
    defaultProjectFolder: "src",
    commands: {
        deploy: {
            args: {
                excludefiles: [
                    "**/node_modules/**",
                    "**/.git/**",
                    "**/.gitignore",
                    "**/package.json",
                    "**/package-lock.json",
                    "**/*.log",
                    "**/test/**",
                    "**/tests/**",
                    "**/.attributes/**"
                ]
            }
        }
    }
};