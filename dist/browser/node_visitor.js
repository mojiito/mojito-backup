"use strict";
var utils_1 = require('../utils/utils');
var debug_1 = require('../debug/debug');
var selector_1 = require('./selector');
var expression_1 = require('./expression');
var metadata_1 = require('./metadata');
var metadata_2 = require('../core/directive/metadata');
// https://github.com/angular/angular/blob/master/modules/%40angular/compiler/src/template_parser/template_parser.ts#L35
// Group 1 = "bind-"
// Group 2 = "let-"
// Group 3 = "ref-/#"
// Group 4 = "on-"
// Group 5 = "bindon-"
// Group 6 = "@"
// Group 7 = the identifier after "bind-", "let-", "ref-/#", "on-", "bindon-" or "@"
// Group 8 = identifier inside [()]
// Group 9 = identifier inside []
// Group 10 = identifier inside ()
var BIND_NAME_REGEXP = /^(?:(?:(?:(bind-)|(let-)|(ref-|#)|(on-)|(bindon-)|(@))(.+))|\[\(([^\)]+)\)\]|\[([^\]]+)\]|\(([^\)]+)\))$/;
var BIND_NAME_POS;
(function (BIND_NAME_POS) {
    BIND_NAME_POS[BIND_NAME_POS["UNDEFINED"] = 0] = "UNDEFINED";
    BIND_NAME_POS[BIND_NAME_POS["KW_BIND_IDX"] = 1] = "KW_BIND_IDX";
    BIND_NAME_POS[BIND_NAME_POS["KW_LET_IDX"] = 2] = "KW_LET_IDX";
    BIND_NAME_POS[BIND_NAME_POS["KW_REF_IDX"] = 3] = "KW_REF_IDX";
    BIND_NAME_POS[BIND_NAME_POS["KW_ON_IDX"] = 4] = "KW_ON_IDX";
    BIND_NAME_POS[BIND_NAME_POS["KW_BINDON_IDX"] = 5] = "KW_BINDON_IDX";
    BIND_NAME_POS[BIND_NAME_POS["KW_AT_IDX"] = 6] = "KW_AT_IDX";
    BIND_NAME_POS[BIND_NAME_POS["IDENT_KW_IDX"] = 7] = "IDENT_KW_IDX";
    BIND_NAME_POS[BIND_NAME_POS["IDENT_BANANA_BOX_IDX"] = 8] = "IDENT_BANANA_BOX_IDX";
    BIND_NAME_POS[BIND_NAME_POS["IDENT_PROPERTY_IDX"] = 9] = "IDENT_PROPERTY_IDX";
    BIND_NAME_POS[BIND_NAME_POS["IDENT_EVENT_IDX"] = 10] = "IDENT_EVENT_IDX";
})(BIND_NAME_POS || (BIND_NAME_POS = {}));
var NodeVisitor = (function () {
    function NodeVisitor(directiveTypes, resolver) {
        var _this = this;
        this._selectables = [];
        this._expressionParser = new expression_1.ExpressionParser();
        directiveTypes.forEach(function (type, index) {
            var metadata = resolver.resolve(type);
            var selector = selector_1.Selector.parse(metadata.selector);
            var compiled = new metadata_1.CompiledDirectiveMetadata(metadata, type);
            _this._selectables.push([selector, compiled]);
        });
    }
    NodeVisitor.prototype.visitElement = function (element, context) {
        var _this = this;
        // Skip <script> and <style> tags
        if (element instanceof HTMLScriptElement || element instanceof HTMLStyleElement) {
            return;
        }
        // Skip <template> tags
        if (element.tagName.toLowerCase() === 'template') {
            return;
        }
        var attrs = element.attributes;
        for (var i = 0, max = attrs.length; i < max; i++) {
            var attr = attrs[i];
            this._parseAttribute(attr);
        }
        // find selectables that match the elements selector     
        var selectables = this._selectables
            .filter(function (s) { return s[0].match(selector_1.Selector.parseElement(element)); })
            .map(function (s) { return s[1]; })
            .forEach(function (directive) { return _this._createDirective(directive, context); });
    };
    NodeVisitor.prototype.visitAttribute = function (attribute, context) {
        console.log('visit Attribute', attribute);
    };
    NodeVisitor.prototype.visitText = function (text, context) {
        console.log('visit Attribute', text);
    };
    NodeVisitor.prototype._parseAttribute = function (attr) {
        var name = this._normalizeAttributeName(attr.name);
        var value = attr.value;
        if (!utils_1.isPresent(value))
            return;
        var bindParts = name.match(BIND_NAME_REGEXP);
        if (utils_1.isPresent(bindParts)) {
            if (utils_1.isPresent(bindParts[BIND_NAME_POS.KW_BIND_IDX])) {
                // Group 1 = "bind-"
                this._parsePropertyOrAnimation(bindParts[BIND_NAME_POS.IDENT_KW_IDX], value);
            }
            else if (bindParts[BIND_NAME_POS.KW_LET_IDX]) {
                // Group 2 = "let-"
                // TODO
                debug_1.Logger.log(debug_1.LogLevel.debug, "Let is currently not supportet: " + name, debug_1.LogType.warn);
            }
            else if (bindParts[BIND_NAME_POS.KW_REF_IDX]) {
                // Group 3 = "ref-/#"
                // TODO
                debug_1.Logger.log(debug_1.LogLevel.debug, "Ref is currently not supportet: " + name, debug_1.LogType.warn);
            }
            else if (bindParts[BIND_NAME_POS.KW_ON_IDX]) {
                // Group 4 = "on-"
                this._parseEvent(bindParts[BIND_NAME_POS.IDENT_KW_IDX], value);
            }
            else if (bindParts[BIND_NAME_POS.KW_BINDON_IDX]) {
                // Group 5 = "bindon-"
                this._parsePropertyOrAnimation(bindParts[BIND_NAME_POS.IDENT_KW_IDX], value);
                this._parseEvent(bindParts[BIND_NAME_POS.IDENT_KW_IDX] + "Change", value + "=$event");
            }
            else if (bindParts[BIND_NAME_POS.KW_AT_IDX]) {
                // Group 6 = "@"
                // TODO
                debug_1.Logger.log(debug_1.LogLevel.debug, "Animations are currently not supportet: " + name, debug_1.LogType.warn);
            }
            else if (bindParts[BIND_NAME_POS.IDENT_BANANA_BOX_IDX]) {
                // Group 8 = identifier inside [()]
                this._parsePropertyOrAnimation(bindParts[BIND_NAME_POS.IDENT_PROPERTY_IDX], value);
                this._parseEvent(bindParts[BIND_NAME_POS.IDENT_PROPERTY_IDX] + "Change", value + "=$event");
            }
            else if (bindParts[BIND_NAME_POS.IDENT_PROPERTY_IDX]) {
                // Group 9 = identifier inside []
                this._parsePropertyOrAnimation(bindParts[BIND_NAME_POS.IDENT_PROPERTY_IDX], value);
            }
            else if (bindParts[BIND_NAME_POS.IDENT_EVENT_IDX]) {
                // Group 10 = identifier inside ()
                this._parseEvent(bindParts[BIND_NAME_POS.IDENT_EVENT_IDX], value);
            }
        }
    };
    NodeVisitor.prototype._parsePropertyOrAnimation = function (name, expression) {
        var animatePropPrefix = 'animate-';
        var animatePropLength = 'animate-'.length;
        var isAnimationProp = name[0] == '@';
        var animationPrefixLength = 1;
        if (name.substring(0, animatePropLength) === animatePropPrefix) {
            isAnimationProp = true;
            animationPrefixLength = animatePropLength;
        }
        if (isAnimationProp) {
            // TODO: Animation
            debug_1.Logger.log(debug_1.LogLevel.debug, "Animations are currently not supportet: " + name, debug_1.LogType.warn);
        }
        else {
            this._parseProperty(name, expression);
        }
    };
    NodeVisitor.prototype._parseProperty = function (name, expression) {
        console.log('parse property: ' + name + ' ' + expression);
    };
    NodeVisitor.prototype._parseEvent = function (name, expression) {
        var parts = utils_1.splitAtColon(name, [null, name]);
        var target = parts[0];
        var eventName = parts[1];
        this._expressionParser.parse(expression);
    };
    NodeVisitor.prototype._parseBinding = function (expression) {
        return expression;
    };
    NodeVisitor.prototype._createDirective = function (directiveMeta, context) {
        if (directiveMeta.metadata instanceof metadata_2.ComponentMetadata) {
            // let providers = Array.isArray(metadata.providers) ? metadata.providers : [];
            // providers = providers.concat([
            //     provide(ElementRef, { useValue: hostElement.elementRef }),
            //     provide(HostElement, { useValue: hostElement }),
            //     provide(hostElement, { useClass: forwardRef(() => this._componentType) })
            // ]);
            console.log(directiveMeta.metadata.providers, context);
        }
    };
    /**
     * Normalizes attribute name, removes "data-"
     * See: https://github.com/angular/angular/blob/master/modules/%40angular/compiler/src/template_parser/template_parser.ts#L583
     *
     * @private
     * @param {string} attrName
     * @returns {string}
     *
     * @memberOf NodeVisitor
     */
    NodeVisitor.prototype._normalizeAttributeName = function (attrName) {
        return /^data-/i.test(attrName) ? attrName.substring(5) : attrName;
    };
    return NodeVisitor;
}());
exports.NodeVisitor = NodeVisitor;
//# sourceMappingURL=node_visitor.js.map