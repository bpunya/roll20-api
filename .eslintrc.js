module.exports = {
    "extends": "airbnb-base",
    "plugins": [
        "import"
    ],
    "rules": {
    "linebreak-style": ["error", "windows"],
    "func-names": ["error", "never"],
    "no-use-before-define": ["error", "nofunc"],
    "max-len": ["error", { "code": 100, "ignoreStrings": true, "ignoreTemplateLiterals": true, "ignoreComments": true }],
    "no-mixed-operators": ["error", { "allowSamePrecedence": true }],
    "no-nested-ternary": "error"
    }
};
