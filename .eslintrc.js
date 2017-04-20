module.exports = {
    "extends": "airbnb-base",
    "plugins": [
        "import"
    ],
    "rules": {
    "linebreak-style": ["error", "windows"],
    "func-names": ["error", "never"],
    "no-use-before-define": ["error", { "functions": false, "classes": false }]
    }
};
