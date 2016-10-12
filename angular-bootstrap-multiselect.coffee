'use strict'
angular.module('ui.multiselect', ['multiselect.tpl.html']).factory('optionParser', [
  '$parse'
  ($parse) ->
#                      00000111000000000000022200000000000000003333333333333330000000000044000
    TYPEAHEAD_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/
    {
      parse: (input) ->
        match = input.match(TYPEAHEAD_REGEXP)
        if !match
          throw new Error('Expected typeahead specification in form of \'_modelValue_ (as _label_)? for _item_ in _collection_\'' + ' but got \'' + input + '\'.')
        {
          itemName: match[3]
          source: $parse(match[4])
          viewMapper: $parse(match[2] or match[1])
          modelMapper: $parse(match[1])
        }
    }
]).directive('multiselect', [
  '$parse'
  '$document'
  '$compile'
  '$interpolate'
  'optionParser'
  ($parse, $document, $compile, $interpolate, optionParser) ->
    {
      restrict: 'E'
      require: 'ngModel'
      link: (originalScope, element, attrs, modelCtrl) ->
        exp = attrs.options
        parsedResult = optionParser.parse(exp)
        isMultiple = if attrs.multiple then true else false
        compareByKey = attrs.compareBy
        
        #specifies the resulting model has to be a flattend array
        isFlatten = if attrs.flatten then true else false
        
        #this is the property the resulting array has to exists off, default id
        flattenProp = attrs.flattenProp
        if !flattenProp? then flattenProp = "id"
        
        scrollAfterRows = attrs.flattenProp
        tabindex = attrs.tabindex
        maxWidth = attrs.maxWidth
        required = false
        scope = originalScope.$new()
        
        parseModel = ->
          scope.items.length = 0
          model = parsedResult.source(originalScope)
          if !angular.isDefined(model) or model == null
            return
          i = 0
          while i < model.length
            local = {}
            local[parsedResult.itemName] = model[i]
            scope.items.push
              label: parsedResult.viewMapper(local)
              model: model[i]
              checked: false
            i++
          return
        
        getHeaderText = ->
          if isEmpty(modelCtrl.$modelValue) or modelCtrl.$modelValue.length == 0
            scope.header = attrs.msHeaderEmpty or 'Select'
            #ms-header-empty
            return scope.header
          if isMultiple
            if attrs.msSelected
              scope.header = $interpolate(attrs.msSelected)(scope)
            else
              if modelCtrl.$modelValue.length > 5
                scope.header = modelCtrl.$modelValue.length + ' ' + 'selected'
              else
                headers = []
                angular.forEach modelCtrl.$modelValue, (value, key) ->
                  local = {}
                  local[parsedResult.itemName] = value
                  headers.push parsedResult.viewMapper(local)
                  return
                scope.header = headers.join(attrs.msHeaderSeperator or ', ')
          else
            local = {}
            local[parsedResult.itemName] = modelCtrl.$modelValue
            scope.header = parsedResult.viewMapper(local)
          return
        
        isEmpty = (obj) ->
          if obj == true or obj == false
            return false
          if !obj
            return true
          if obj.length and obj.length > 0
            return false
          for prop of obj
            if obj[prop]
              return false
          if compareByKey != undefined and obj[compareByKey] != undefined
            return false
          true
        
        selectSingle = (item) ->
          if !item.checked
            scope.uncheckAll()
            item.checked = !item.checked
          setModelValue false
          return
        
        selectMultiple = (item) ->
          item.checked = !item.checked
          setModelValue true
          return
        
        setModelValue = (isMultiple) ->
          value = undefined
          if isMultiple
            value = []
            angular.forEach scope.items, (item) ->
              if item.checked
                if isFlatten and flattenProp?
                  value.push item.model[flattenProp]
                else
                  value.push item.model
              return
          else
            angular.forEach scope.items, (item) ->
              if item.checked
                value = item.model
                return false
              return
          
          console.log "setting view value ->"
          console.log value
          modelCtrl.$setViewValue value
          return
            
        _markChecked = (item, compareItem) ->
          if isFlatten and flattenProp? and angular.equals(item.model[flattenProp], compareItem)
            item.checked = true
          else if ! compareByKey? and angular.equals(item.model,compareItem)
              item.checked = true
          else if compareByKey? and compareItem? and angular.equals(item.model[compareByKey], compareItem[compareByKey])
              item.checked = true
          
        markChecked = (newVal) ->
#          console.log "markChecked func"
#          console.log newVal
            
          if !angular.isArray(newVal)
            #result is a single selected value or object
            for item in scope.items
              item.checked = false
              _markChecked(item,newVal)
          else
            #result is an array of objects or an array of values
            for item in scope.items
              item.checked = false
              
              for selected_item in newVal
                _markChecked(item,selected_item)
#          console.log scope.items
          
          
#        markChecked_old = (newVal) ->
#          if !angular.isArray(newVal)
#            angular.forEach scope.items, (item) ->
#              item.checked = false
#              if compareByKey == undefined and angular.equals(item.model, newVal)
#                item.checked = true
#              else if compareByKey != undefined and newVal != null and angular.equals(item.model[compareByKey], newVal[compareByKey])
#                item.checked = true
#              return
#          else
#            angular.forEach scope.items, (item) ->
#              item.checked = false
#              angular.forEach newVal, (i) ->
#                if compareByKey == undefined and angular.equals(item.model, i)
#                  item.checked = true
#                else if compareByKey != undefined and angular.equals(item.model[compareByKey], i[compareByKey])
#                  item.checked = true
#                return
#              return
#          return
        
        scope.filterAfterRows = attrs.filterAfterRows
        changeHandler = attrs.change or angular.noop
        scope.items = []
        scope.header = 'Select'
        scope.multiple = isMultiple
        scope.disabled = false
        scope.ulStyle = {}
        if scrollAfterRows != undefined and parseInt(scrollAfterRows).toString() == scrollAfterRows
          scope.ulStyle =
            'max-height': scrollAfterRows * 26 + 14 + 'px'
            'overflow-y': 'auto'
            'overflow-x': 'hidden'
        if tabindex != undefined and parseInt(tabindex).toString() == tabindex
          scope.tabindex = tabindex
        if maxWidth != undefined and parseInt(maxWidth).toString() == maxWidth
          scope.maxWidth =
            'max-width': maxWidth + 'px'
        originalScope.$on '$destroy', ->
          scope.$destroy()
          return
        popUpEl = angular.element('<multiselect-popup></multiselect-popup>')
        #required validator
        if attrs.required or attrs.ngRequired
          required = true
        attrs.$observe 'required', (newVal) ->
          required = newVal
          return
        #watch disabled state
        scope.$watch (->
          $parse(attrs.ngDisabled) originalScope
        ), (newVal) ->
          scope.disabled = newVal
          return
        #watch single/multiple state for dynamically change single to multiple
        scope.$watch (->
          $parse(attrs.multiple) originalScope
        ), (newVal) ->
          isMultiple = newVal or false
          return
        #watch option changes for options that are populated dynamically
        scope.$watch (->
          parsedResult.source originalScope
        ), ((newVal) ->
          if angular.isDefined(newVal)
            parseModel()
          return
        ), true
        #watch model change
        scope.$watch (->
          modelCtrl.$modelValue
        ), ((newVal, oldVal) ->
#when directive initialize, newVal usually undefined. Also, if model value already set in the controller
#for preselected list then we need to mark checked in our scope item. But we don't want to do this every time
#model changes. We need to do this only if it is done outside directive scope, from controller, for example.
          if angular.isDefined(newVal)
            markChecked newVal
            scope.$eval changeHandler
          getHeaderText()
          modelCtrl.$setValidity 'required', scope.valid()
          return
        ), true
        parseModel()
        element.append $compile(popUpEl)(scope)
        
        scope.valid = ->
          if !required
            return true
          value = modelCtrl.$modelValue
          angular.isArray(value) and value.length > 0 or !angular.isArray(value) and value != null
        
        scope.checkAll = ->
          if !isMultiple
            return
          angular.forEach scope.items, (item) ->
            item.checked = true
            return
          setModelValue true
          return
        
        scope.uncheckAll = ->
          angular.forEach scope.items, (item) ->
            item.checked = false
            return
          setModelValue true
          return
        
        scope.select = (event, item) ->
          if isMultiple == false
            selectSingle item
            scope.toggleSelect()
          else
            event.stopPropagation()
            selectMultiple item
          return
        
        return
      
    }
]).directive 'multiselectPopup', [
  '$document'
  ($document) ->
    {
      restrict: 'E'
      scope: false
      replace: true
      templateUrl: 'multiselect.tpl.html'
      link: (scope, element, attrs) ->
#				$("ul.dropdown-menu").on("click", "[data-stopPropagation]", function(e) {
#					e.stopPropagation();
#				});
        clickHandler = (event) ->
          if elementMatchesAnyInArray(event.target, element.find(event.target.tagName))
            return
          element.removeClass 'open'
          $document.unbind 'click', clickHandler
          scope.$apply()
          return
        
        scope.isVisible = false
        
        scope.toggleSelect = ->
          if element.hasClass('open')
            scope.filter = ''
            element.removeClass 'open'
            $document.unbind 'click', clickHandler
          else
            scope.filter = ''
            element.addClass 'open'
            $document.bind 'click', clickHandler
          return
        
        elementMatchesAnyInArray = (element, elementArray) ->
          i = 0
          while i < elementArray.length
            if element == elementArray[i]
              return true
            i++
          false
        
        return
      
    }
]
angular.module('multiselect.tpl.html', []).run [
  '$templateCache'
  ($templateCache) ->
    $templateCache.put 'multiselect.tpl.html', '<div class="btn-group">\n' + '  <button tabindex="{{tabindex}}" title="{{header}}" type="button" class="btn btn-white dropdown-toggle" ng-click="toggleSelect()" ng-disabled="disabled" ng-class="{\'error\': !valid()}">\n' + '    <div ng-style="maxWidth" style="padding-right: 13px; overflow: hidden; text-overflow: ellipsis;">{{header}}</div><span class="caret" style="position:absolute;right:10px;top:14px;"></span>\n' + '  </button>\n' + '  <ul class="dropdown-menu" style="margin-bottom:30px;padding-left:5px;padding-right:5px;" ng-style="ulStyle">\n' + '    <input ng-show="items.length > filterAfterRows" ng-model="filter" style="padding: 0px 3px;margin-right: 15px; margin-bottom: 4px;" placeholder="Type to filter options">' + '    <li data-stopPropagation="true" ng-repeat="i in items | filter:filter">\n' + '      <a ng-click="select($event, i)" style="padding:3px 10px;cursor:pointer;">\n' + '        <i class="glyphicon" ng-class="{\'glyphicon-ok\': i.checked, \'empty\': !i.checked}"></i> {{i.label}}</a>\n' + '    </li>\n' + '  </ul>\n' + '</div>'
    return
]

# ---
# generated by js2coffee 2.2.0