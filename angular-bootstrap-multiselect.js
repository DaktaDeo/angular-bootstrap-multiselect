// Generated by CoffeeScript 1.11.1
(function() {
  'use strict';
  angular.module('ui.multiselect', ['multiselect.tpl.html']).factory('optionParser', [
    '$parse', function($parse) {
      var TYPEAHEAD_REGEXP;
      TYPEAHEAD_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/;
      return {
        parse: function(input) {
          var match;
          match = input.match(TYPEAHEAD_REGEXP);
          if (!match) {
            throw new Error('Expected typeahead specification in form of \'_modelValue_ (as _label_)? for _item_ in _collection_\'' + ' but got \'' + input + '\'.');
          }
          return {
            itemName: match[3],
            source: $parse(match[4]),
            viewMapper: $parse(match[2] || match[1]),
            modelMapper: $parse(match[1])
          };
        }
      };
    }
  ]).directive('multiselect', [
    '$parse', '$document', '$compile', '$interpolate', 'optionParser', function($parse, $document, $compile, $interpolate, optionParser) {
      return {
        restrict: 'E',
        require: 'ngModel',
        link: function(originalScope, element, attrs, modelCtrl) {
          var _markChecked, changeHandler, compareByKey, exp, flattenProp, getHeaderText, isEmpty, isFlatten, isMultiple, markChecked, maxWidth, parseModel, parsedResult, popUpEl, required, scope, scrollAfterRows, selectMultiple, selectSingle, setModelValue, tabindex;
          exp = attrs.options;
          parsedResult = optionParser.parse(exp);
          isMultiple = attrs.multiple ? true : false;
          compareByKey = attrs.compareBy;
          isFlatten = attrs.flatten ? true : false;
          flattenProp = attrs.flattenProp;
          if (flattenProp == null) {
            flattenProp = "id";
          }
          scrollAfterRows = attrs.flattenProp;
          tabindex = attrs.tabindex;
          maxWidth = attrs.maxWidth;
          required = false;
          scope = originalScope.$new();
          parseModel = function() {
            var i, local, model;
            scope.items.length = 0;
            model = parsedResult.source(originalScope);
            if (!angular.isDefined(model) || model === null) {
              return;
            }
            i = 0;
            while (i < model.length) {
              local = {};
              local[parsedResult.itemName] = model[i];
              scope.items.push({
                label: parsedResult.viewMapper(local),
                model: model[i],
                checked: false
              });
              i++;
            }
          };
          getHeaderText = function() {
            var headers, local;
            if (isEmpty(modelCtrl.$modelValue) || modelCtrl.$modelValue.length === 0) {
              scope.header = attrs.msHeaderEmpty || 'Select';
              return scope.header;
            }
            if (isMultiple) {
              if (attrs.msSelected) {
                scope.header = $interpolate(attrs.msSelected)(scope);
              } else {
                if (modelCtrl.$modelValue.length > 5) {
                  scope.header = modelCtrl.$modelValue.length + ' ' + 'selected';
                } else {
                  headers = [];
                  angular.forEach(modelCtrl.$modelValue, function(value, key) {
                    var local;
                    local = {};
                    local[parsedResult.itemName] = value;
                    headers.push(parsedResult.viewMapper(local));
                  });
                  scope.header = headers.join(attrs.msHeaderSeperator || ', ');
                }
              }
            } else {
              local = {};
              local[parsedResult.itemName] = modelCtrl.$modelValue;
              scope.header = parsedResult.viewMapper(local);
            }
          };
          isEmpty = function(obj) {
            var prop;
            if (obj === true || obj === false) {
              return false;
            }
            if (!obj) {
              return true;
            }
            if (obj.length && obj.length > 0) {
              return false;
            }
            for (prop in obj) {
              if (obj[prop]) {
                return false;
              }
            }
            if (compareByKey !== void 0 && obj[compareByKey] !== void 0) {
              return false;
            }
            return true;
          };
          selectSingle = function(item) {
            if (!item.checked) {
              scope.uncheckAll();
              item.checked = !item.checked;
            }
            setModelValue(false);
          };
          selectMultiple = function(item) {
            item.checked = !item.checked;
            setModelValue(true);
          };
          setModelValue = function(isMultiple) {
            var value;
            value = void 0;
            if (isMultiple) {
              value = [];
              angular.forEach(scope.items, function(item) {
                if (item.checked) {
                  if (isFlatten && (flattenProp != null)) {
                    value.push(item.model[flattenProp]);
                  } else {
                    value.push(item.model);
                  }
                }
              });
            } else {
              angular.forEach(scope.items, function(item) {
                if (item.checked) {
                  value = item.model;
                  return false;
                }
              });
            }
            console.log("setting view value ->");
            console.log(value);
            modelCtrl.$setViewValue(value);
          };
          _markChecked = function(item, compareItem) {
            if (isFlatten && (flattenProp != null) && angular.equals(item.model[flattenProp], compareItem)) {
              return item.checked = true;
            } else if ((compareByKey == null) && angular.equals(item.model, compareItem)) {
              return item.checked = true;
            } else if ((compareByKey != null) && (compareItem != null) && angular.equals(item.model[compareByKey], compareItem[compareByKey])) {
              return item.checked = true;
            }
          };
          markChecked = function(newVal) {
            var item, j, k, len, len1, ref, ref1, results, results1, selected_item;
            if (!angular.isArray(newVal)) {
              ref = scope.items;
              results = [];
              for (j = 0, len = ref.length; j < len; j++) {
                item = ref[j];
                item.checked = false;
                results.push(_markChecked(item, newVal));
              }
              return results;
            } else {
              ref1 = scope.items;
              results1 = [];
              for (k = 0, len1 = ref1.length; k < len1; k++) {
                item = ref1[k];
                item.checked = false;
                results1.push((function() {
                  var l, len2, results2;
                  results2 = [];
                  for (l = 0, len2 = newVal.length; l < len2; l++) {
                    selected_item = newVal[l];
                    results2.push(_markChecked(item, selected_item));
                  }
                  return results2;
                })());
              }
              return results1;
            }
          };
          scope.filterAfterRows = attrs.filterAfterRows;
          changeHandler = attrs.change || angular.noop;
          scope.items = [];
          scope.header = 'Select';
          scope.multiple = isMultiple;
          scope.disabled = false;
          scope.ulStyle = {};
          if (scrollAfterRows !== void 0 && parseInt(scrollAfterRows).toString() === scrollAfterRows) {
            scope.ulStyle = {
              'max-height': scrollAfterRows * 26 + 14 + 'px',
              'overflow-y': 'auto',
              'overflow-x': 'hidden'
            };
          }
          if (tabindex !== void 0 && parseInt(tabindex).toString() === tabindex) {
            scope.tabindex = tabindex;
          }
          if (maxWidth !== void 0 && parseInt(maxWidth).toString() === maxWidth) {
            scope.maxWidth = {
              'max-width': maxWidth + 'px'
            };
          }
          originalScope.$on('$destroy', function() {
            scope.$destroy();
          });
          popUpEl = angular.element('<multiselect-popup></multiselect-popup>');
          if (attrs.required || attrs.ngRequired) {
            required = true;
          }
          attrs.$observe('required', function(newVal) {
            required = newVal;
          });
          scope.$watch((function() {
            return $parse(attrs.ngDisabled)(originalScope);
          }), function(newVal) {
            scope.disabled = newVal;
          });
          scope.$watch((function() {
            return $parse(attrs.multiple)(originalScope);
          }), function(newVal) {
            isMultiple = newVal || false;
          });
          scope.$watch((function() {
            return parsedResult.source(originalScope);
          }), (function(newVal) {
            if (angular.isDefined(newVal)) {
              parseModel();
            }
          }), true);
          scope.$watch((function() {
            return modelCtrl.$modelValue;
          }), (function(newVal, oldVal) {
            if (angular.isDefined(newVal)) {
              markChecked(newVal);
              scope.$eval(changeHandler);
            }
            getHeaderText();
            modelCtrl.$setValidity('required', scope.valid());
          }), true);
          parseModel();
          element.append($compile(popUpEl)(scope));
          scope.valid = function() {
            var value;
            if (!required) {
              return true;
            }
            value = modelCtrl.$modelValue;
            return angular.isArray(value) && value.length > 0 || !angular.isArray(value) && value !== null;
          };
          scope.checkAll = function() {
            if (!isMultiple) {
              return;
            }
            angular.forEach(scope.items, function(item) {
              item.checked = true;
            });
            setModelValue(true);
          };
          scope.uncheckAll = function() {
            angular.forEach(scope.items, function(item) {
              item.checked = false;
            });
            setModelValue(true);
          };
          scope.select = function(event, item) {
            if (isMultiple === false) {
              selectSingle(item);
              scope.toggleSelect();
            } else {
              event.stopPropagation();
              selectMultiple(item);
            }
          };
        }
      };
    }
  ]).directive('multiselectPopup', [
    '$document', function($document) {
      return {
        restrict: 'E',
        scope: false,
        replace: true,
        templateUrl: 'multiselect.tpl.html',
        link: function(scope, element, attrs) {
          var clickHandler, elementMatchesAnyInArray;
          clickHandler = function(event) {
            if (elementMatchesAnyInArray(event.target, element.find(event.target.tagName))) {
              return;
            }
            element.removeClass('open');
            $document.unbind('click', clickHandler);
            scope.$apply();
          };
          scope.isVisible = false;
          scope.toggleSelect = function() {
            if (element.hasClass('open')) {
              scope.filter = '';
              element.removeClass('open');
              $document.unbind('click', clickHandler);
            } else {
              scope.filter = '';
              element.addClass('open');
              $document.bind('click', clickHandler);
            }
          };
          elementMatchesAnyInArray = function(element, elementArray) {
            var i;
            i = 0;
            while (i < elementArray.length) {
              if (element === elementArray[i]) {
                return true;
              }
              i++;
            }
            return false;
          };
        }
      };
    }
  ]);

  angular.module('multiselect.tpl.html', []).run([
    '$templateCache', function($templateCache) {
      $templateCache.put('multiselect.tpl.html', '<div class="btn-group">\n' + '  <button tabindex="{{tabindex}}" title="{{header}}" type="button" class="btn btn-white dropdown-toggle" ng-click="toggleSelect()" ng-disabled="disabled" ng-class="{\'error\': !valid()}">\n' + '    <div ng-style="maxWidth" style="padding-right: 13px; overflow: hidden; text-overflow: ellipsis;">{{header}}</div><span class="caret" style="position:absolute;right:10px;top:14px;"></span>\n' + '  </button>\n' + '  <ul class="dropdown-menu" style="margin-bottom:30px;padding-left:5px;padding-right:5px;" ng-style="ulStyle">\n' + '    <input ng-show="items.length > filterAfterRows" ng-model="filter" style="padding: 0px 3px;margin-right: 15px; margin-bottom: 4px;" placeholder="Type to filter options">' + '    <li data-stopPropagation="true" ng-repeat="i in items | filter:filter">\n' + '      <a ng-click="select($event, i)" style="padding:3px 10px;cursor:pointer;">\n' + '        <i class="glyphicon" ng-class="{\'glyphicon-ok\': i.checked, \'empty\': !i.checked}"></i> {{i.label}}</a>\n' + '    </li>\n' + '  </ul>\n' + '</div>');
    }
  ]);

}).call(this);

//# sourceMappingURL=angular-bootstrap-multiselect.js.map
