"use strict"
var generators = require("yeoman-generator"),
    ld = require("lodash");

var prompts = [];

/**
Prompts user with a checklist of packages to be installed on project.

"frontend_packages" contains the list of packages within that checklist.
*/
// TODO : Clean it up so that bower_path is a variable and you can just loop over vars in templates
var frontend_packages = [
    {
        name: "jQuery (> 2.0)",
        value: "jquery",
        checked: true,
        bower_package: "jquery",
        version: "^2.1.1",
        category: "js"
    },
    {
        name: "Modernizr ~ Browser feature detection",
        value: "modernizr",
        checked: true,
        bower_package: "modernizr",
        version: "^2.8.3",
        category: "js"
    },
    {
        name: "Lo-Dash ~ Advanced list & object manipulation",
        value: "lodash",
        checked: false,
        bower_package: "lodash",
        version: "^2.4.1",
        category: "js"
    },
    {
        name: "Ember.js ~ Client side MVC",
        value: "ember",
        checked: false,
        bower_package: "ember",
        version: "^1.8.0",
        category: "js"
    },
    {
        name: "Moment.js ~ Time & date helpers",
        value: "moment",
        checked: false,
        bower_package: "moment",
        version: "~2.8.4",
        category: "js"
    },
    {
        name: "Eric Meyer's CSS Reset",
        value: "mey_reset",
        checked: true,
        bower_package: "reset-scss",
        category: "scss"
    },
    {
        name: "Bourbon",
        value: "bourbon",
        checked: true,
        bower_package: "bourbon",
        version: "^4.0.1",
        category: "scss"
    },
    {
        name: "Scut",
        value: "scut",
        checked: true,
        bower_package: "scut",
        version: "^0.10.3",
        category: "scss"
    },
    {
        name: "Foundation",
        value: "foundation",
        checked: false,
        bower_package: "foundation",
        version: "^5.4.7",
        category: "scss"
    }
];

/**
Prompts user with a checklist of packages to be installed on project
*/
prompts = prompts.concat([
    {
        type: "checkbox",
        name: "jspkgs",
        message: "Javascript packages to include in your project",
        choices: ld.filter(frontend_packages, {category: "js"})
    },
    {
        type: "checkbox",
        name: "scsspkgs",
        message: "SCSS packages to include in your project",
        choices: ld.filter(frontend_packages, {category: "scss"})
    }
]);

/**
Prompts for frontend packages that depend on the initial packages selected.
*/
var dependent_packages = [
    {
        when: function(response) {
            return response.scsspkgs.indexOf("bourbon") > -1;
        },
        type: "confirm",
        name: "neat",
        message: "You've included Bourbon in this project. Would you also like to add the SCSS grid framework Neat?",
        default: true,
        bower_package: "neat",
        version: "^1.7.0",
        value: "neat"
    },
    // {
    //     when: function(response) {
    //         return response.scsspkgs.indexOf("bourbon") > -1;
    //     },
    //     type: "confirm",
    //     name: "ember-data",
    //     message: "You've included Ember.js in this project. Would you also like to add Ember-Data?",
    //     default: true,
    //     bower_package: "ember-data",
    //     version: "^0.0.14",
    //     value: "ember-data"
    // },
];

prompts = prompts.concat(dependent_packages);

/**
frontend_packages needs updating with the dependent_packages so that they can be
installed alongside the other packages, at a later phase of the scaffold.
*/
frontend_packages = frontend_packages.concat(dependent_packages);


/**
Main setup function
*/
module.exports = generators.Base.extend({
    prompting: function() {
        var done = this.async();

        prompts.unshift({
            type: "input",
            name: "name",
            message: "Your project's name",
            default: this.appname
        });

        this.prompt(
            prompts,
            function(answers){
                /**
                Basic app settings
                */
                this.appName = answers.name;
                this.slugName = this._.underscored(this.appName);
                this.frontendPackages = answers.scsspkgs.concat(answers.jspkgs);

                /**
                Handle package dependent packages
                */
                for (var i = dependent_packages.length - 1; i >= 0; i--) {
                    if (answers[dependent_packages[i].name]) {
                        this.frontendPackages.push(dependent_packages[i].name);
                    }
                };

                /**
                Define contextual variables for the whole build script.

                Add each optional package as a boolean.
                */
                this.ctxVars = {
                    name: this.appName,
                    slugName: this.slugName,
                    frontendPackages: this.frontendPackages,
                };

                for (var i = 0; i < frontend_packages.length; i++) {
                    this.ctxVars[frontend_packages[i].value] = this.frontendPackages.indexOf(frontend_packages[i].value) > -1;
                };

                /**
                Resolve async
                */
                done();
            }.bind(this)
        );
    },
    scaffoldFolders: function() {
        var _this = this;

        /**
        Basic directory operations
        */
        var directories_to_make = [
            "src",
            "src/js",
            "src/scss",
            "src/img",
            "src/fonts",
            "src/templates",
        ];

        if (this.ctxVars.ember) {
            directories_to_make = directories_to_make.concat([
                "src/templates/components",
                "src/templates/partials",
            ]);
        } else {
            directories_to_make = directories_to_make.concat([
                "src/templates/data",
                "src/templates/includes",
                "src/templates/layouts",
                "src/templates/pages",
            ]);
        }

        for (var i = 0; i < directories_to_make.length; i++) {
            _this.mkdir(directories_to_make[i])
        };
    },
    writing: function() {
        var _this = this;
        /**
        Basic copy operations
        */
        var to_copy = [
            ".tpl.gitignore",
            ".tpl.bowerrc",
        ];

        if (!this.ctxVars.ember) {
            to_copy = to_copy.concat([
                "src/templates/data/data.tpl.json",
                "src/templates/pages/index.tpl.swig",
                "src/templates/includes/footer.tpl.swig",
                "src/templates/includes/header.tpl.swig",
            ]);
        }

        for (var i = to_copy.length - 1; i >= 0; i--) {
            _this.copy(to_copy[i], to_copy[i].replace(".tpl", ""));
        };

        /**
        Files requiring templating
        */
        var to_template = [
                "bower.tpl.json",
                "config.tpl.rb",
                "package.tpl.json",
                "Gruntfile.tpl.js",
                "src/js/app.tpl.js",
                "src/scss/_settings.tpl.scss",
                "src/scss/app.tpl.scss",
            ];

        if (this.ctxVars.ember) {
            to_template = to_template.concat([
                "index.tpl.html",
            ]);
        } else {
            to_template = to_template.concat([
                "src/templates/data/meta.tpl.json",
                "src/templates/layouts/base.tpl.swig"
            ]);
        }

        this.ctxVars["build_location"] = "build/";
        this.ctxVars["src_location"] = "src/";

        for (var i = to_template.length - 1; i >= 0; i--) {
            _this.template(
                to_template[i],
                to_template[i].replace(".tpl", ""),
                this.ctxVars
            );
        };
    },
    install: function() {
        /**
        Install Node packages
        */
        this.npmInstall();


        /**
        Ember specific logic
        */
        if (this.ctxVars.ember) {
            this.npmInstall("grunt-ember-templates", {"save": true});
        }
        
        /**
        Create array of Bower packages and versions
        */
        var for_bower_to_install = [],
            fpkg, fpkg_ver;

        for (var i = 0; i < frontend_packages.length; i++) {
            fpkg = frontend_packages[i];
            
            if (this.frontendPackages.indexOf(fpkg.value) > -1) {
                fpkg_ver = ld.has(fpkg, "version") ? fpkg.bower_package + "#" + fpkg.version : fpkg.bower_package;
                for_bower_to_install.push(fpkg_ver);
            }
        };

        /**
        Install Bower packages
        */
        this.bowerInstall(for_bower_to_install, {"save": true});

    },
    end: function() {
        /**
        Do an initial Grunt build
        */
        this.spawnCommand("grunt", ["build"]);

    }
});