import {
  __commonJS,
  require_react
} from "./chunk-UTEJFLXC.js";

// node_modules/scheduler/cjs/scheduler.development.js
var require_scheduler_development = __commonJS({
  "node_modules/scheduler/cjs/scheduler.development.js"(exports) {
    "use strict";
    if (true) {
      (function() {
        "use strict";
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
        }
        var enableSchedulerDebugging = false;
        var enableProfiling = false;
        var frameYieldMs = 5;
        function push(heap, node) {
          var index = heap.length;
          heap.push(node);
          siftUp(heap, node, index);
        }
        function peek(heap) {
          return heap.length === 0 ? null : heap[0];
        }
        function pop(heap) {
          if (heap.length === 0) {
            return null;
          }
          var first = heap[0];
          var last = heap.pop();
          if (last !== first) {
            heap[0] = last;
            siftDown(heap, last, 0);
          }
          return first;
        }
        function siftUp(heap, node, i) {
          var index = i;
          while (index > 0) {
            var parentIndex = index - 1 >>> 1;
            var parent = heap[parentIndex];
            if (compare(parent, node) > 0) {
              heap[parentIndex] = node;
              heap[index] = parent;
              index = parentIndex;
            } else {
              return;
            }
          }
        }
        function siftDown(heap, node, i) {
          var index = i;
          var length = heap.length;
          var halfLength = length >>> 1;
          while (index < halfLength) {
            var leftIndex = (index + 1) * 2 - 1;
            var left = heap[leftIndex];
            var rightIndex = leftIndex + 1;
            var right = heap[rightIndex];
            if (compare(left, node) < 0) {
              if (rightIndex < length && compare(right, left) < 0) {
                heap[index] = right;
                heap[rightIndex] = node;
                index = rightIndex;
              } else {
                heap[index] = left;
                heap[leftIndex] = node;
                index = leftIndex;
              }
            } else if (rightIndex < length && compare(right, node) < 0) {
              heap[index] = right;
              heap[rightIndex] = node;
              index = rightIndex;
            } else {
              return;
            }
          }
        }
        function compare(a, b) {
          var diff = a.sortIndex - b.sortIndex;
          return diff !== 0 ? diff : a.id - b.id;
        }
        var ImmediatePriority = 1;
        var UserBlockingPriority = 2;
        var NormalPriority = 3;
        var LowPriority = 4;
        var IdlePriority = 5;
        function markTaskErrored(task, ms) {
        }
        var hasPerformanceNow = typeof performance === "object" && typeof performance.now === "function";
        if (hasPerformanceNow) {
          var localPerformance = performance;
          exports.unstable_now = function() {
            return localPerformance.now();
          };
        } else {
          var localDate = Date;
          var initialTime = localDate.now();
          exports.unstable_now = function() {
            return localDate.now() - initialTime;
          };
        }
        var maxSigned31BitInt = 1073741823;
        var IMMEDIATE_PRIORITY_TIMEOUT = -1;
        var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
        var NORMAL_PRIORITY_TIMEOUT = 5e3;
        var LOW_PRIORITY_TIMEOUT = 1e4;
        var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
        var taskQueue = [];
        var timerQueue = [];
        var taskIdCounter = 1;
        var currentTask = null;
        var currentPriorityLevel = NormalPriority;
        var isPerformingWork = false;
        var isHostCallbackScheduled = false;
        var isHostTimeoutScheduled = false;
        var localSetTimeout = typeof setTimeout === "function" ? setTimeout : null;
        var localClearTimeout = typeof clearTimeout === "function" ? clearTimeout : null;
        var localSetImmediate = typeof setImmediate !== "undefined" ? setImmediate : null;
        var isInputPending = typeof navigator !== "undefined" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 ? navigator.scheduling.isInputPending.bind(navigator.scheduling) : null;
        function advanceTimers(currentTime) {
          var timer = peek(timerQueue);
          while (timer !== null) {
            if (timer.callback === null) {
              pop(timerQueue);
            } else if (timer.startTime <= currentTime) {
              pop(timerQueue);
              timer.sortIndex = timer.expirationTime;
              push(taskQueue, timer);
            } else {
              return;
            }
            timer = peek(timerQueue);
          }
        }
        function handleTimeout(currentTime) {
          isHostTimeoutScheduled = false;
          advanceTimers(currentTime);
          if (!isHostCallbackScheduled) {
            if (peek(taskQueue) !== null) {
              isHostCallbackScheduled = true;
              requestHostCallback(flushWork);
            } else {
              var firstTimer = peek(timerQueue);
              if (firstTimer !== null) {
                requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
              }
            }
          }
        }
        function flushWork(hasTimeRemaining, initialTime2) {
          isHostCallbackScheduled = false;
          if (isHostTimeoutScheduled) {
            isHostTimeoutScheduled = false;
            cancelHostTimeout();
          }
          isPerformingWork = true;
          var previousPriorityLevel = currentPriorityLevel;
          try {
            if (enableProfiling) {
              try {
                return workLoop(hasTimeRemaining, initialTime2);
              } catch (error) {
                if (currentTask !== null) {
                  var currentTime = exports.unstable_now();
                  markTaskErrored(currentTask, currentTime);
                  currentTask.isQueued = false;
                }
                throw error;
              }
            } else {
              return workLoop(hasTimeRemaining, initialTime2);
            }
          } finally {
            currentTask = null;
            currentPriorityLevel = previousPriorityLevel;
            isPerformingWork = false;
          }
        }
        function workLoop(hasTimeRemaining, initialTime2) {
          var currentTime = initialTime2;
          advanceTimers(currentTime);
          currentTask = peek(taskQueue);
          while (currentTask !== null && !enableSchedulerDebugging) {
            if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYieldToHost())) {
              break;
            }
            var callback = currentTask.callback;
            if (typeof callback === "function") {
              currentTask.callback = null;
              currentPriorityLevel = currentTask.priorityLevel;
              var didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
              var continuationCallback = callback(didUserCallbackTimeout);
              currentTime = exports.unstable_now();
              if (typeof continuationCallback === "function") {
                currentTask.callback = continuationCallback;
              } else {
                if (currentTask === peek(taskQueue)) {
                  pop(taskQueue);
                }
              }
              advanceTimers(currentTime);
            } else {
              pop(taskQueue);
            }
            currentTask = peek(taskQueue);
          }
          if (currentTask !== null) {
            return true;
          } else {
            var firstTimer = peek(timerQueue);
            if (firstTimer !== null) {
              requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
            }
            return false;
          }
        }
        function unstable_runWithPriority(priorityLevel, eventHandler) {
          switch (priorityLevel) {
            case ImmediatePriority:
            case UserBlockingPriority:
            case NormalPriority:
            case LowPriority:
            case IdlePriority:
              break;
            default:
              priorityLevel = NormalPriority;
          }
          var previousPriorityLevel = currentPriorityLevel;
          currentPriorityLevel = priorityLevel;
          try {
            return eventHandler();
          } finally {
            currentPriorityLevel = previousPriorityLevel;
          }
        }
        function unstable_next(eventHandler) {
          var priorityLevel;
          switch (currentPriorityLevel) {
            case ImmediatePriority:
            case UserBlockingPriority:
            case NormalPriority:
              priorityLevel = NormalPriority;
              break;
            default:
              priorityLevel = currentPriorityLevel;
              break;
          }
          var previousPriorityLevel = currentPriorityLevel;
          currentPriorityLevel = priorityLevel;
          try {
            return eventHandler();
          } finally {
            currentPriorityLevel = previousPriorityLevel;
          }
        }
        function unstable_wrapCallback(callback) {
          var parentPriorityLevel = currentPriorityLevel;
          return function() {
            var previousPriorityLevel = currentPriorityLevel;
            currentPriorityLevel = parentPriorityLevel;
            try {
              return callback.apply(this, arguments);
            } finally {
              currentPriorityLevel = previousPriorityLevel;
            }
          };
        }
        function unstable_scheduleCallback(priorityLevel, callback, options) {
          var currentTime = exports.unstable_now();
          var startTime2;
          if (typeof options === "object" && options !== null) {
            var delay = options.delay;
            if (typeof delay === "number" && delay > 0) {
              startTime2 = currentTime + delay;
            } else {
              startTime2 = currentTime;
            }
          } else {
            startTime2 = currentTime;
          }
          var timeout;
          switch (priorityLevel) {
            case ImmediatePriority:
              timeout = IMMEDIATE_PRIORITY_TIMEOUT;
              break;
            case UserBlockingPriority:
              timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
              break;
            case IdlePriority:
              timeout = IDLE_PRIORITY_TIMEOUT;
              break;
            case LowPriority:
              timeout = LOW_PRIORITY_TIMEOUT;
              break;
            case NormalPriority:
            default:
              timeout = NORMAL_PRIORITY_TIMEOUT;
              break;
          }
          var expirationTime = startTime2 + timeout;
          var newTask = {
            id: taskIdCounter++,
            callback,
            priorityLevel,
            startTime: startTime2,
            expirationTime,
            sortIndex: -1
          };
          if (startTime2 > currentTime) {
            newTask.sortIndex = startTime2;
            push(timerQueue, newTask);
            if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
              if (isHostTimeoutScheduled) {
                cancelHostTimeout();
              } else {
                isHostTimeoutScheduled = true;
              }
              requestHostTimeout(handleTimeout, startTime2 - currentTime);
            }
          } else {
            newTask.sortIndex = expirationTime;
            push(taskQueue, newTask);
            if (!isHostCallbackScheduled && !isPerformingWork) {
              isHostCallbackScheduled = true;
              requestHostCallback(flushWork);
            }
          }
          return newTask;
        }
        function unstable_pauseExecution() {
        }
        function unstable_continueExecution() {
          if (!isHostCallbackScheduled && !isPerformingWork) {
            isHostCallbackScheduled = true;
            requestHostCallback(flushWork);
          }
        }
        function unstable_getFirstCallbackNode() {
          return peek(taskQueue);
        }
        function unstable_cancelCallback(task) {
          task.callback = null;
        }
        function unstable_getCurrentPriorityLevel() {
          return currentPriorityLevel;
        }
        var isMessageLoopRunning = false;
        var scheduledHostCallback = null;
        var taskTimeoutID = -1;
        var frameInterval = frameYieldMs;
        var startTime = -1;
        function shouldYieldToHost() {
          var timeElapsed = exports.unstable_now() - startTime;
          if (timeElapsed < frameInterval) {
            return false;
          }
          return true;
        }
        function requestPaint() {
        }
        function forceFrameRate(fps) {
          if (fps < 0 || fps > 125) {
            console["error"]("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported");
            return;
          }
          if (fps > 0) {
            frameInterval = Math.floor(1e3 / fps);
          } else {
            frameInterval = frameYieldMs;
          }
        }
        var performWorkUntilDeadline = function() {
          if (scheduledHostCallback !== null) {
            var currentTime = exports.unstable_now();
            startTime = currentTime;
            var hasTimeRemaining = true;
            var hasMoreWork = true;
            try {
              hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
            } finally {
              if (hasMoreWork) {
                schedulePerformWorkUntilDeadline();
              } else {
                isMessageLoopRunning = false;
                scheduledHostCallback = null;
              }
            }
          } else {
            isMessageLoopRunning = false;
          }
        };
        var schedulePerformWorkUntilDeadline;
        if (typeof localSetImmediate === "function") {
          schedulePerformWorkUntilDeadline = function() {
            localSetImmediate(performWorkUntilDeadline);
          };
        } else if (typeof MessageChannel !== "undefined") {
          var channel = new MessageChannel();
          var port = channel.port2;
          channel.port1.onmessage = performWorkUntilDeadline;
          schedulePerformWorkUntilDeadline = function() {
            port.postMessage(null);
          };
        } else {
          schedulePerformWorkUntilDeadline = function() {
            localSetTimeout(performWorkUntilDeadline, 0);
          };
        }
        function requestHostCallback(callback) {
          scheduledHostCallback = callback;
          if (!isMessageLoopRunning) {
            isMessageLoopRunning = true;
            schedulePerformWorkUntilDeadline();
          }
        }
        function requestHostTimeout(callback, ms) {
          taskTimeoutID = localSetTimeout(function() {
            callback(exports.unstable_now());
          }, ms);
        }
        function cancelHostTimeout() {
          localClearTimeout(taskTimeoutID);
          taskTimeoutID = -1;
        }
        var unstable_requestPaint = requestPaint;
        var unstable_Profiling = null;
        exports.unstable_IdlePriority = IdlePriority;
        exports.unstable_ImmediatePriority = ImmediatePriority;
        exports.unstable_LowPriority = LowPriority;
        exports.unstable_NormalPriority = NormalPriority;
        exports.unstable_Profiling = unstable_Profiling;
        exports.unstable_UserBlockingPriority = UserBlockingPriority;
        exports.unstable_cancelCallback = unstable_cancelCallback;
        exports.unstable_continueExecution = unstable_continueExecution;
        exports.unstable_forceFrameRate = forceFrameRate;
        exports.unstable_getCurrentPriorityLevel = unstable_getCurrentPriorityLevel;
        exports.unstable_getFirstCallbackNode = unstable_getFirstCallbackNode;
        exports.unstable_next = unstable_next;
        exports.unstable_pauseExecution = unstable_pauseExecution;
        exports.unstable_requestPaint = unstable_requestPaint;
        exports.unstable_runWithPriority = unstable_runWithPriority;
        exports.unstable_scheduleCallback = unstable_scheduleCallback;
        exports.unstable_shouldYield = shouldYieldToHost;
        exports.unstable_wrapCallback = unstable_wrapCallback;
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
        }
      })();
    }
  }
});

// node_modules/scheduler/index.js
var require_scheduler = __commonJS({
  "node_modules/scheduler/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_scheduler_development();
    }
  }
});

// node_modules/react-dom/cjs/react-dom.development.js
var require_react_dom_development = __commonJS({
  "node_modules/react-dom/cjs/react-dom.development.js"(exports) {
    "use strict";
    if (true) {
      (function() {
        "use strict";
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
        }
        var React = require_react();
        var Scheduler = require_scheduler();
        var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        var suppressWarning = false;
        function setSuppressWarning(newSuppressWarning) {
          {
            suppressWarning = newSuppressWarning;
          }
        }
        function warn(format) {
          {
            if (!suppressWarning) {
              for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
              }
              printWarning("warn", format, args);
            }
          }
        }
        function error(format) {
          {
            if (!suppressWarning) {
              for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
              }
              printWarning("error", format, args);
            }
          }
        }
        function printWarning(level, format, args) {
          {
            var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame2.getStackAddendum();
            if (stack !== "") {
              format += "%s";
              args = args.concat([stack]);
            }
            var argsWithFormat = args.map(function(item) {
              return String(item);
            });
            argsWithFormat.unshift("Warning: " + format);
            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }
        var FunctionComponent = 0;
        var ClassComponent = 1;
        var IndeterminateComponent = 2;
        var HostRoot = 3;
        var HostPortal = 4;
        var HostComponent = 5;
        var HostText = 6;
        var Fragment = 7;
        var Mode = 8;
        var ContextConsumer = 9;
        var ContextProvider = 10;
        var ForwardRef = 11;
        var Profiler = 12;
        var SuspenseComponent = 13;
        var MemoComponent = 14;
        var SimpleMemoComponent = 15;
        var LazyComponent = 16;
        var IncompleteClassComponent = 17;
        var DehydratedFragment = 18;
        var SuspenseListComponent = 19;
        var ScopeComponent = 21;
        var OffscreenComponent = 22;
        var LegacyHiddenComponent = 23;
        var CacheComponent = 24;
        var TracingMarkerComponent = 25;
        var enableClientRenderFallbackOnTextMismatch = true;
        var enableNewReconciler = false;
        var enableLazyContextPropagation = false;
        var enableLegacyHidden = false;
        var enableSuspenseAvoidThisFallback = false;
        var disableCommentsAsDOMContainers = true;
        var enableCustomElementPropertySupport = false;
        var warnAboutStringRefs = true;
        var enableSchedulingProfiler = true;
        var enableProfilerTimer = true;
        var enableProfilerCommitHooks = true;
        var allNativeEvents = /* @__PURE__ */ new Set();
        var registrationNameDependencies = {};
        var possibleRegistrationNames = {};
        function registerTwoPhaseEvent(registrationName, dependencies) {
          registerDirectEvent(registrationName, dependencies);
          registerDirectEvent(registrationName + "Capture", dependencies);
        }
        function registerDirectEvent(registrationName, dependencies) {
          {
            if (registrationNameDependencies[registrationName]) {
              error("EventRegistry: More than one plugin attempted to publish the same registration name, `%s`.", registrationName);
            }
          }
          registrationNameDependencies[registrationName] = dependencies;
          {
            var lowerCasedName = registrationName.toLowerCase();
            possibleRegistrationNames[lowerCasedName] = registrationName;
            if (registrationName === "onDoubleClick") {
              possibleRegistrationNames.ondblclick = registrationName;
            }
          }
          for (var i = 0; i < dependencies.length; i++) {
            allNativeEvents.add(dependencies[i]);
          }
        }
        var canUseDOM = !!(typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined");
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        function typeName(value) {
          {
            var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
            var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            return type;
          }
        }
        function willCoercionThrow(value) {
          {
            try {
              testStringCoercion(value);
              return false;
            } catch (e) {
              return true;
            }
          }
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkAttributeStringCoercion(value, attributeName) {
          {
            if (willCoercionThrow(value)) {
              error("The provided `%s` attribute is an unsupported type %s. This value must be coerced to a string before before using it here.", attributeName, typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        function checkKeyStringCoercion(value) {
          {
            if (willCoercionThrow(value)) {
              error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        function checkPropStringCoercion(value, propName) {
          {
            if (willCoercionThrow(value)) {
              error("The provided `%s` prop is an unsupported type %s. This value must be coerced to a string before before using it here.", propName, typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        function checkCSSPropertyStringCoercion(value, propName) {
          {
            if (willCoercionThrow(value)) {
              error("The provided `%s` CSS property is an unsupported type %s. This value must be coerced to a string before before using it here.", propName, typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        function checkHtmlStringCoercion(value) {
          {
            if (willCoercionThrow(value)) {
              error("The provided HTML markup uses a value of unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        function checkFormFieldValueStringCoercion(value) {
          {
            if (willCoercionThrow(value)) {
              error("Form field values (value, checked, defaultValue, or defaultChecked props) must be strings, not %s. This value must be coerced to a string before before using it here.", typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        var RESERVED = 0;
        var STRING = 1;
        var BOOLEANISH_STRING = 2;
        var BOOLEAN = 3;
        var OVERLOADED_BOOLEAN = 4;
        var NUMERIC = 5;
        var POSITIVE_NUMERIC = 6;
        var ATTRIBUTE_NAME_START_CHAR = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
        var ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
        var VALID_ATTRIBUTE_NAME_REGEX = new RegExp("^[" + ATTRIBUTE_NAME_START_CHAR + "][" + ATTRIBUTE_NAME_CHAR + "]*$");
        var illegalAttributeNameCache = {};
        var validatedAttributeNameCache = {};
        function isAttributeNameSafe(attributeName) {
          if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
            return true;
          }
          if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
            return false;
          }
          if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
            validatedAttributeNameCache[attributeName] = true;
            return true;
          }
          illegalAttributeNameCache[attributeName] = true;
          {
            error("Invalid attribute name: `%s`", attributeName);
          }
          return false;
        }
        function shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag) {
          if (propertyInfo !== null) {
            return propertyInfo.type === RESERVED;
          }
          if (isCustomComponentTag) {
            return false;
          }
          if (name.length > 2 && (name[0] === "o" || name[0] === "O") && (name[1] === "n" || name[1] === "N")) {
            return true;
          }
          return false;
        }
        function shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag) {
          if (propertyInfo !== null && propertyInfo.type === RESERVED) {
            return false;
          }
          switch (typeof value) {
            case "function":
            case "symbol":
              return true;
            case "boolean": {
              if (isCustomComponentTag) {
                return false;
              }
              if (propertyInfo !== null) {
                return !propertyInfo.acceptsBooleans;
              } else {
                var prefix2 = name.toLowerCase().slice(0, 5);
                return prefix2 !== "data-" && prefix2 !== "aria-";
              }
            }
            default:
              return false;
          }
        }
        function shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag) {
          if (value === null || typeof value === "undefined") {
            return true;
          }
          if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag)) {
            return true;
          }
          if (isCustomComponentTag) {
            return false;
          }
          if (propertyInfo !== null) {
            switch (propertyInfo.type) {
              case BOOLEAN:
                return !value;
              case OVERLOADED_BOOLEAN:
                return value === false;
              case NUMERIC:
                return isNaN(value);
              case POSITIVE_NUMERIC:
                return isNaN(value) || value < 1;
            }
          }
          return false;
        }
        function getPropertyInfo(name) {
          return properties.hasOwnProperty(name) ? properties[name] : null;
        }
        function PropertyInfoRecord(name, type, mustUseProperty, attributeName, attributeNamespace, sanitizeURL2, removeEmptyString) {
          this.acceptsBooleans = type === BOOLEANISH_STRING || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
          this.attributeName = attributeName;
          this.attributeNamespace = attributeNamespace;
          this.mustUseProperty = mustUseProperty;
          this.propertyName = name;
          this.type = type;
          this.sanitizeURL = sanitizeURL2;
          this.removeEmptyString = removeEmptyString;
        }
        var properties = {};
        var reservedProps = [
          "children",
          "dangerouslySetInnerHTML",
          // TODO: This prevents the assignment of defaultValue to regular
          // elements (not just inputs). Now that ReactDOMInput assigns to the
          // defaultValue property -- do we need this?
          "defaultValue",
          "defaultChecked",
          "innerHTML",
          "suppressContentEditableWarning",
          "suppressHydrationWarning",
          "style"
        ];
        reservedProps.forEach(function(name) {
          properties[name] = new PropertyInfoRecord(
            name,
            RESERVED,
            false,
            // mustUseProperty
            name,
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(_ref) {
          var name = _ref[0], attributeName = _ref[1];
          properties[name] = new PropertyInfoRecord(
            name,
            STRING,
            false,
            // mustUseProperty
            attributeName,
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(name) {
          properties[name] = new PropertyInfoRecord(
            name,
            BOOLEANISH_STRING,
            false,
            // mustUseProperty
            name.toLowerCase(),
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(name) {
          properties[name] = new PropertyInfoRecord(
            name,
            BOOLEANISH_STRING,
            false,
            // mustUseProperty
            name,
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        [
          "allowFullScreen",
          "async",
          // Note: there is a special case that prevents it from being written to the DOM
          // on the client side because the browsers are inconsistent. Instead we call focus().
          "autoFocus",
          "autoPlay",
          "controls",
          "default",
          "defer",
          "disabled",
          "disablePictureInPicture",
          "disableRemotePlayback",
          "formNoValidate",
          "hidden",
          "loop",
          "noModule",
          "noValidate",
          "open",
          "playsInline",
          "readOnly",
          "required",
          "reversed",
          "scoped",
          "seamless",
          // Microdata
          "itemScope"
        ].forEach(function(name) {
          properties[name] = new PropertyInfoRecord(
            name,
            BOOLEAN,
            false,
            // mustUseProperty
            name.toLowerCase(),
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        [
          "checked",
          // Note: `option.selected` is not updated if `select.multiple` is
          // disabled with `removeAttribute`. We have special logic for handling this.
          "multiple",
          "muted",
          "selected"
          // NOTE: if you add a camelCased prop to this list,
          // you'll need to set attributeName to name.toLowerCase()
          // instead in the assignment below.
        ].forEach(function(name) {
          properties[name] = new PropertyInfoRecord(
            name,
            BOOLEAN,
            true,
            // mustUseProperty
            name,
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        [
          "capture",
          "download"
          // NOTE: if you add a camelCased prop to this list,
          // you'll need to set attributeName to name.toLowerCase()
          // instead in the assignment below.
        ].forEach(function(name) {
          properties[name] = new PropertyInfoRecord(
            name,
            OVERLOADED_BOOLEAN,
            false,
            // mustUseProperty
            name,
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        [
          "cols",
          "rows",
          "size",
          "span"
          // NOTE: if you add a camelCased prop to this list,
          // you'll need to set attributeName to name.toLowerCase()
          // instead in the assignment below.
        ].forEach(function(name) {
          properties[name] = new PropertyInfoRecord(
            name,
            POSITIVE_NUMERIC,
            false,
            // mustUseProperty
            name,
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        ["rowSpan", "start"].forEach(function(name) {
          properties[name] = new PropertyInfoRecord(
            name,
            NUMERIC,
            false,
            // mustUseProperty
            name.toLowerCase(),
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        var CAMELIZE = /[\-\:]([a-z])/g;
        var capitalize = function(token) {
          return token[1].toUpperCase();
        };
        [
          "accent-height",
          "alignment-baseline",
          "arabic-form",
          "baseline-shift",
          "cap-height",
          "clip-path",
          "clip-rule",
          "color-interpolation",
          "color-interpolation-filters",
          "color-profile",
          "color-rendering",
          "dominant-baseline",
          "enable-background",
          "fill-opacity",
          "fill-rule",
          "flood-color",
          "flood-opacity",
          "font-family",
          "font-size",
          "font-size-adjust",
          "font-stretch",
          "font-style",
          "font-variant",
          "font-weight",
          "glyph-name",
          "glyph-orientation-horizontal",
          "glyph-orientation-vertical",
          "horiz-adv-x",
          "horiz-origin-x",
          "image-rendering",
          "letter-spacing",
          "lighting-color",
          "marker-end",
          "marker-mid",
          "marker-start",
          "overline-position",
          "overline-thickness",
          "paint-order",
          "panose-1",
          "pointer-events",
          "rendering-intent",
          "shape-rendering",
          "stop-color",
          "stop-opacity",
          "strikethrough-position",
          "strikethrough-thickness",
          "stroke-dasharray",
          "stroke-dashoffset",
          "stroke-linecap",
          "stroke-linejoin",
          "stroke-miterlimit",
          "stroke-opacity",
          "stroke-width",
          "text-anchor",
          "text-decoration",
          "text-rendering",
          "underline-position",
          "underline-thickness",
          "unicode-bidi",
          "unicode-range",
          "units-per-em",
          "v-alphabetic",
          "v-hanging",
          "v-ideographic",
          "v-mathematical",
          "vector-effect",
          "vert-adv-y",
          "vert-origin-x",
          "vert-origin-y",
          "word-spacing",
          "writing-mode",
          "xmlns:xlink",
          "x-height"
          // NOTE: if you add a camelCased prop to this list,
          // you'll need to set attributeName to name.toLowerCase()
          // instead in the assignment below.
        ].forEach(function(attributeName) {
          var name = attributeName.replace(CAMELIZE, capitalize);
          properties[name] = new PropertyInfoRecord(
            name,
            STRING,
            false,
            // mustUseProperty
            attributeName,
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        [
          "xlink:actuate",
          "xlink:arcrole",
          "xlink:role",
          "xlink:show",
          "xlink:title",
          "xlink:type"
          // NOTE: if you add a camelCased prop to this list,
          // you'll need to set attributeName to name.toLowerCase()
          // instead in the assignment below.
        ].forEach(function(attributeName) {
          var name = attributeName.replace(CAMELIZE, capitalize);
          properties[name] = new PropertyInfoRecord(
            name,
            STRING,
            false,
            // mustUseProperty
            attributeName,
            "http://www.w3.org/1999/xlink",
            false,
            // sanitizeURL
            false
          );
        });
        [
          "xml:base",
          "xml:lang",
          "xml:space"
          // NOTE: if you add a camelCased prop to this list,
          // you'll need to set attributeName to name.toLowerCase()
          // instead in the assignment below.
        ].forEach(function(attributeName) {
          var name = attributeName.replace(CAMELIZE, capitalize);
          properties[name] = new PropertyInfoRecord(
            name,
            STRING,
            false,
            // mustUseProperty
            attributeName,
            "http://www.w3.org/XML/1998/namespace",
            false,
            // sanitizeURL
            false
          );
        });
        ["tabIndex", "crossOrigin"].forEach(function(attributeName) {
          properties[attributeName] = new PropertyInfoRecord(
            attributeName,
            STRING,
            false,
            // mustUseProperty
            attributeName.toLowerCase(),
            // attributeName
            null,
            // attributeNamespace
            false,
            // sanitizeURL
            false
          );
        });
        var xlinkHref = "xlinkHref";
        properties[xlinkHref] = new PropertyInfoRecord(
          "xlinkHref",
          STRING,
          false,
          // mustUseProperty
          "xlink:href",
          "http://www.w3.org/1999/xlink",
          true,
          // sanitizeURL
          false
        );
        ["src", "href", "action", "formAction"].forEach(function(attributeName) {
          properties[attributeName] = new PropertyInfoRecord(
            attributeName,
            STRING,
            false,
            // mustUseProperty
            attributeName.toLowerCase(),
            // attributeName
            null,
            // attributeNamespace
            true,
            // sanitizeURL
            true
          );
        });
        var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;
        var didWarn = false;
        function sanitizeURL(url) {
          {
            if (!didWarn && isJavaScriptProtocol.test(url)) {
              didWarn = true;
              error("A future version of React will block javascript: URLs as a security precaution. Use event handlers instead if you can. If you need to generate unsafe HTML try using dangerouslySetInnerHTML instead. React was passed %s.", JSON.stringify(url));
            }
          }
        }
        function getValueForProperty(node, name, expected, propertyInfo) {
          {
            if (propertyInfo.mustUseProperty) {
              var propertyName = propertyInfo.propertyName;
              return node[propertyName];
            } else {
              {
                checkAttributeStringCoercion(expected, name);
              }
              if (propertyInfo.sanitizeURL) {
                sanitizeURL("" + expected);
              }
              var attributeName = propertyInfo.attributeName;
              var stringValue = null;
              if (propertyInfo.type === OVERLOADED_BOOLEAN) {
                if (node.hasAttribute(attributeName)) {
                  var value = node.getAttribute(attributeName);
                  if (value === "") {
                    return true;
                  }
                  if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
                    return value;
                  }
                  if (value === "" + expected) {
                    return expected;
                  }
                  return value;
                }
              } else if (node.hasAttribute(attributeName)) {
                if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
                  return node.getAttribute(attributeName);
                }
                if (propertyInfo.type === BOOLEAN) {
                  return expected;
                }
                stringValue = node.getAttribute(attributeName);
              }
              if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
                return stringValue === null ? expected : stringValue;
              } else if (stringValue === "" + expected) {
                return expected;
              } else {
                return stringValue;
              }
            }
          }
        }
        function getValueForAttribute(node, name, expected, isCustomComponentTag) {
          {
            if (!isAttributeNameSafe(name)) {
              return;
            }
            if (!node.hasAttribute(name)) {
              return expected === void 0 ? void 0 : null;
            }
            var value = node.getAttribute(name);
            {
              checkAttributeStringCoercion(expected, name);
            }
            if (value === "" + expected) {
              return expected;
            }
            return value;
          }
        }
        function setValueForProperty(node, name, value, isCustomComponentTag) {
          var propertyInfo = getPropertyInfo(name);
          if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) {
            return;
          }
          if (shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)) {
            value = null;
          }
          if (isCustomComponentTag || propertyInfo === null) {
            if (isAttributeNameSafe(name)) {
              var _attributeName = name;
              if (value === null) {
                node.removeAttribute(_attributeName);
              } else {
                {
                  checkAttributeStringCoercion(value, name);
                }
                node.setAttribute(_attributeName, "" + value);
              }
            }
            return;
          }
          var mustUseProperty = propertyInfo.mustUseProperty;
          if (mustUseProperty) {
            var propertyName = propertyInfo.propertyName;
            if (value === null) {
              var type = propertyInfo.type;
              node[propertyName] = type === BOOLEAN ? false : "";
            } else {
              node[propertyName] = value;
            }
            return;
          }
          var attributeName = propertyInfo.attributeName, attributeNamespace = propertyInfo.attributeNamespace;
          if (value === null) {
            node.removeAttribute(attributeName);
          } else {
            var _type = propertyInfo.type;
            var attributeValue;
            if (_type === BOOLEAN || _type === OVERLOADED_BOOLEAN && value === true) {
              attributeValue = "";
            } else {
              {
                {
                  checkAttributeStringCoercion(value, attributeName);
                }
                attributeValue = "" + value;
              }
              if (propertyInfo.sanitizeURL) {
                sanitizeURL(attributeValue.toString());
              }
            }
            if (attributeNamespace) {
              node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
            } else {
              node.setAttribute(attributeName, attributeValue);
            }
          }
        }
        var REACT_ELEMENT_TYPE = Symbol.for("react.element");
        var REACT_PORTAL_TYPE = Symbol.for("react.portal");
        var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
        var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
        var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
        var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
        var REACT_CONTEXT_TYPE = Symbol.for("react.context");
        var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
        var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
        var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
        var REACT_MEMO_TYPE = Symbol.for("react.memo");
        var REACT_LAZY_TYPE = Symbol.for("react.lazy");
        var REACT_SCOPE_TYPE = Symbol.for("react.scope");
        var REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode");
        var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
        var REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden");
        var REACT_CACHE_TYPE = Symbol.for("react.cache");
        var REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker");
        var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
        var FAUX_ITERATOR_SYMBOL = "@@iterator";
        function getIteratorFn(maybeIterable) {
          if (maybeIterable === null || typeof maybeIterable !== "object") {
            return null;
          }
          var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
          if (typeof maybeIterator === "function") {
            return maybeIterator;
          }
          return null;
        }
        var assign = Object.assign;
        var disabledDepth = 0;
        var prevLog;
        var prevInfo;
        var prevWarn;
        var prevError;
        var prevGroup;
        var prevGroupCollapsed;
        var prevGroupEnd;
        function disabledLog() {
        }
        disabledLog.__reactDisabledLog = true;
        function disableLogs() {
          {
            if (disabledDepth === 0) {
              prevLog = console.log;
              prevInfo = console.info;
              prevWarn = console.warn;
              prevError = console.error;
              prevGroup = console.group;
              prevGroupCollapsed = console.groupCollapsed;
              prevGroupEnd = console.groupEnd;
              var props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
              };
              Object.defineProperties(console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
              });
            }
            disabledDepth++;
          }
        }
        function reenableLogs() {
          {
            disabledDepth--;
            if (disabledDepth === 0) {
              var props = {
                configurable: true,
                enumerable: true,
                writable: true
              };
              Object.defineProperties(console, {
                log: assign({}, props, {
                  value: prevLog
                }),
                info: assign({}, props, {
                  value: prevInfo
                }),
                warn: assign({}, props, {
                  value: prevWarn
                }),
                error: assign({}, props, {
                  value: prevError
                }),
                group: assign({}, props, {
                  value: prevGroup
                }),
                groupCollapsed: assign({}, props, {
                  value: prevGroupCollapsed
                }),
                groupEnd: assign({}, props, {
                  value: prevGroupEnd
                })
              });
            }
            if (disabledDepth < 0) {
              error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
            }
          }
        }
        var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
        var prefix;
        function describeBuiltInComponentFrame(name, source, ownerFn) {
          {
            if (prefix === void 0) {
              try {
                throw Error();
              } catch (x) {
                var match = x.stack.trim().match(/\n( *(at )?)/);
                prefix = match && match[1] || "";
              }
            }
            return "\n" + prefix + name;
          }
        }
        var reentry = false;
        var componentFrameCache;
        {
          var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
          componentFrameCache = new PossiblyWeakMap();
        }
        function describeNativeComponentFrame(fn, construct) {
          if (!fn || reentry) {
            return "";
          }
          {
            var frame = componentFrameCache.get(fn);
            if (frame !== void 0) {
              return frame;
            }
          }
          var control;
          reentry = true;
          var previousPrepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          var previousDispatcher;
          {
            previousDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = null;
            disableLogs();
          }
          try {
            if (construct) {
              var Fake = function() {
                throw Error();
              };
              Object.defineProperty(Fake.prototype, "props", {
                set: function() {
                  throw Error();
                }
              });
              if (typeof Reflect === "object" && Reflect.construct) {
                try {
                  Reflect.construct(Fake, []);
                } catch (x) {
                  control = x;
                }
                Reflect.construct(fn, [], Fake);
              } else {
                try {
                  Fake.call();
                } catch (x) {
                  control = x;
                }
                fn.call(Fake.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (x) {
                control = x;
              }
              fn();
            }
          } catch (sample) {
            if (sample && control && typeof sample.stack === "string") {
              var sampleLines = sample.stack.split("\n");
              var controlLines = control.stack.split("\n");
              var s = sampleLines.length - 1;
              var c = controlLines.length - 1;
              while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                c--;
              }
              for (; s >= 1 && c >= 0; s--, c--) {
                if (sampleLines[s] !== controlLines[c]) {
                  if (s !== 1 || c !== 1) {
                    do {
                      s--;
                      c--;
                      if (c < 0 || sampleLines[s] !== controlLines[c]) {
                        var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                        if (fn.displayName && _frame.includes("<anonymous>")) {
                          _frame = _frame.replace("<anonymous>", fn.displayName);
                        }
                        {
                          if (typeof fn === "function") {
                            componentFrameCache.set(fn, _frame);
                          }
                        }
                        return _frame;
                      }
                    } while (s >= 1 && c >= 0);
                  }
                  break;
                }
              }
            }
          } finally {
            reentry = false;
            {
              ReactCurrentDispatcher.current = previousDispatcher;
              reenableLogs();
            }
            Error.prepareStackTrace = previousPrepareStackTrace;
          }
          var name = fn ? fn.displayName || fn.name : "";
          var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
          {
            if (typeof fn === "function") {
              componentFrameCache.set(fn, syntheticFrame);
            }
          }
          return syntheticFrame;
        }
        function describeClassComponentFrame(ctor, source, ownerFn) {
          {
            return describeNativeComponentFrame(ctor, true);
          }
        }
        function describeFunctionComponentFrame(fn, source, ownerFn) {
          {
            return describeNativeComponentFrame(fn, false);
          }
        }
        function shouldConstruct(Component) {
          var prototype = Component.prototype;
          return !!(prototype && prototype.isReactComponent);
        }
        function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
          if (type == null) {
            return "";
          }
          if (typeof type === "function") {
            {
              return describeNativeComponentFrame(type, shouldConstruct(type));
            }
          }
          if (typeof type === "string") {
            return describeBuiltInComponentFrame(type);
          }
          switch (type) {
            case REACT_SUSPENSE_TYPE:
              return describeBuiltInComponentFrame("Suspense");
            case REACT_SUSPENSE_LIST_TYPE:
              return describeBuiltInComponentFrame("SuspenseList");
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_FORWARD_REF_TYPE:
                return describeFunctionComponentFrame(type.render);
              case REACT_MEMO_TYPE:
                return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                } catch (x) {
                }
              }
            }
          }
          return "";
        }
        function describeFiber(fiber) {
          var owner = fiber._debugOwner ? fiber._debugOwner.type : null;
          var source = fiber._debugSource;
          switch (fiber.tag) {
            case HostComponent:
              return describeBuiltInComponentFrame(fiber.type);
            case LazyComponent:
              return describeBuiltInComponentFrame("Lazy");
            case SuspenseComponent:
              return describeBuiltInComponentFrame("Suspense");
            case SuspenseListComponent:
              return describeBuiltInComponentFrame("SuspenseList");
            case FunctionComponent:
            case IndeterminateComponent:
            case SimpleMemoComponent:
              return describeFunctionComponentFrame(fiber.type);
            case ForwardRef:
              return describeFunctionComponentFrame(fiber.type.render);
            case ClassComponent:
              return describeClassComponentFrame(fiber.type);
            default:
              return "";
          }
        }
        function getStackByFiberInDevAndProd(workInProgress2) {
          try {
            var info = "";
            var node = workInProgress2;
            do {
              info += describeFiber(node);
              node = node.return;
            } while (node);
            return info;
          } catch (x) {
            return "\nError generating stack: " + x.message + "\n" + x.stack;
          }
        }
        function getWrappedName(outerType, innerType, wrapperName) {
          var displayName = outerType.displayName;
          if (displayName) {
            return displayName;
          }
          var functionName = innerType.displayName || innerType.name || "";
          return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
        }
        function getContextName(type) {
          return type.displayName || "Context";
        }
        function getComponentNameFromType(type) {
          if (type == null) {
            return null;
          }
          {
            if (typeof type.tag === "number") {
              error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
            }
          }
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }
          if (typeof type === "string") {
            return type;
          }
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
              case REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
              case REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
              case REACT_MEMO_TYPE:
                var outerName = type.displayName || null;
                if (outerName !== null) {
                  return outerName;
                }
                return getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return getComponentNameFromType(init(payload));
                } catch (x) {
                  return null;
                }
              }
            }
          }
          return null;
        }
        function getWrappedName$1(outerType, innerType, wrapperName) {
          var functionName = innerType.displayName || innerType.name || "";
          return outerType.displayName || (functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName);
        }
        function getContextName$1(type) {
          return type.displayName || "Context";
        }
        function getComponentNameFromFiber(fiber) {
          var tag = fiber.tag, type = fiber.type;
          switch (tag) {
            case CacheComponent:
              return "Cache";
            case ContextConsumer:
              var context = type;
              return getContextName$1(context) + ".Consumer";
            case ContextProvider:
              var provider = type;
              return getContextName$1(provider._context) + ".Provider";
            case DehydratedFragment:
              return "DehydratedFragment";
            case ForwardRef:
              return getWrappedName$1(type, type.render, "ForwardRef");
            case Fragment:
              return "Fragment";
            case HostComponent:
              return type;
            case HostPortal:
              return "Portal";
            case HostRoot:
              return "Root";
            case HostText:
              return "Text";
            case LazyComponent:
              return getComponentNameFromType(type);
            case Mode:
              if (type === REACT_STRICT_MODE_TYPE) {
                return "StrictMode";
              }
              return "Mode";
            case OffscreenComponent:
              return "Offscreen";
            case Profiler:
              return "Profiler";
            case ScopeComponent:
              return "Scope";
            case SuspenseComponent:
              return "Suspense";
            case SuspenseListComponent:
              return "SuspenseList";
            case TracingMarkerComponent:
              return "TracingMarker";
            case ClassComponent:
            case FunctionComponent:
            case IncompleteClassComponent:
            case IndeterminateComponent:
            case MemoComponent:
            case SimpleMemoComponent:
              if (typeof type === "function") {
                return type.displayName || type.name || null;
              }
              if (typeof type === "string") {
                return type;
              }
              break;
          }
          return null;
        }
        var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
        var current = null;
        var isRendering = false;
        function getCurrentFiberOwnerNameInDevOrNull() {
          {
            if (current === null) {
              return null;
            }
            var owner = current._debugOwner;
            if (owner !== null && typeof owner !== "undefined") {
              return getComponentNameFromFiber(owner);
            }
          }
          return null;
        }
        function getCurrentFiberStackInDev() {
          {
            if (current === null) {
              return "";
            }
            return getStackByFiberInDevAndProd(current);
          }
        }
        function resetCurrentFiber() {
          {
            ReactDebugCurrentFrame.getCurrentStack = null;
            current = null;
            isRendering = false;
          }
        }
        function setCurrentFiber(fiber) {
          {
            ReactDebugCurrentFrame.getCurrentStack = fiber === null ? null : getCurrentFiberStackInDev;
            current = fiber;
            isRendering = false;
          }
        }
        function getCurrentFiber() {
          {
            return current;
          }
        }
        function setIsRendering(rendering) {
          {
            isRendering = rendering;
          }
        }
        function toString(value) {
          return "" + value;
        }
        function getToStringValue(value) {
          switch (typeof value) {
            case "boolean":
            case "number":
            case "string":
            case "undefined":
              return value;
            case "object":
              {
                checkFormFieldValueStringCoercion(value);
              }
              return value;
            default:
              return "";
          }
        }
        var hasReadOnlyValue = {
          button: true,
          checkbox: true,
          image: true,
          hidden: true,
          radio: true,
          reset: true,
          submit: true
        };
        function checkControlledValueProps(tagName, props) {
          {
            if (!(hasReadOnlyValue[props.type] || props.onChange || props.onInput || props.readOnly || props.disabled || props.value == null)) {
              error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.");
            }
            if (!(props.onChange || props.readOnly || props.disabled || props.checked == null)) {
              error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.");
            }
          }
        }
        function isCheckable(elem) {
          var type = elem.type;
          var nodeName = elem.nodeName;
          return nodeName && nodeName.toLowerCase() === "input" && (type === "checkbox" || type === "radio");
        }
        function getTracker(node) {
          return node._valueTracker;
        }
        function detachTracker(node) {
          node._valueTracker = null;
        }
        function getValueFromNode(node) {
          var value = "";
          if (!node) {
            return value;
          }
          if (isCheckable(node)) {
            value = node.checked ? "true" : "false";
          } else {
            value = node.value;
          }
          return value;
        }
        function trackValueOnNode(node) {
          var valueField = isCheckable(node) ? "checked" : "value";
          var descriptor = Object.getOwnPropertyDescriptor(node.constructor.prototype, valueField);
          {
            checkFormFieldValueStringCoercion(node[valueField]);
          }
          var currentValue = "" + node[valueField];
          if (node.hasOwnProperty(valueField) || typeof descriptor === "undefined" || typeof descriptor.get !== "function" || typeof descriptor.set !== "function") {
            return;
          }
          var get2 = descriptor.get, set2 = descriptor.set;
          Object.defineProperty(node, valueField, {
            configurable: true,
            get: function() {
              return get2.call(this);
            },
            set: function(value) {
              {
                checkFormFieldValueStringCoercion(value);
              }
              currentValue = "" + value;
              set2.call(this, value);
            }
          });
          Object.defineProperty(node, valueField, {
            enumerable: descriptor.enumerable
          });
          var tracker = {
            getValue: function() {
              return currentValue;
            },
            setValue: function(value) {
              {
                checkFormFieldValueStringCoercion(value);
              }
              currentValue = "" + value;
            },
            stopTracking: function() {
              detachTracker(node);
              delete node[valueField];
            }
          };
          return tracker;
        }
        function track(node) {
          if (getTracker(node)) {
            return;
          }
          node._valueTracker = trackValueOnNode(node);
        }
        function updateValueIfChanged(node) {
          if (!node) {
            return false;
          }
          var tracker = getTracker(node);
          if (!tracker) {
            return true;
          }
          var lastValue = tracker.getValue();
          var nextValue = getValueFromNode(node);
          if (nextValue !== lastValue) {
            tracker.setValue(nextValue);
            return true;
          }
          return false;
        }
        function getActiveElement(doc) {
          doc = doc || (typeof document !== "undefined" ? document : void 0);
          if (typeof doc === "undefined") {
            return null;
          }
          try {
            return doc.activeElement || doc.body;
          } catch (e) {
            return doc.body;
          }
        }
        var didWarnValueDefaultValue = false;
        var didWarnCheckedDefaultChecked = false;
        var didWarnControlledToUncontrolled = false;
        var didWarnUncontrolledToControlled = false;
        function isControlled(props) {
          var usesChecked = props.type === "checkbox" || props.type === "radio";
          return usesChecked ? props.checked != null : props.value != null;
        }
        function getHostProps(element, props) {
          var node = element;
          var checked = props.checked;
          var hostProps = assign({}, props, {
            defaultChecked: void 0,
            defaultValue: void 0,
            value: void 0,
            checked: checked != null ? checked : node._wrapperState.initialChecked
          });
          return hostProps;
        }
        function initWrapperState(element, props) {
          {
            checkControlledValueProps("input", props);
            if (props.checked !== void 0 && props.defaultChecked !== void 0 && !didWarnCheckedDefaultChecked) {
              error("%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://reactjs.org/link/controlled-components", getCurrentFiberOwnerNameInDevOrNull() || "A component", props.type);
              didWarnCheckedDefaultChecked = true;
            }
            if (props.value !== void 0 && props.defaultValue !== void 0 && !didWarnValueDefaultValue) {
              error("%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://reactjs.org/link/controlled-components", getCurrentFiberOwnerNameInDevOrNull() || "A component", props.type);
              didWarnValueDefaultValue = true;
            }
          }
          var node = element;
          var defaultValue = props.defaultValue == null ? "" : props.defaultValue;
          node._wrapperState = {
            initialChecked: props.checked != null ? props.checked : props.defaultChecked,
            initialValue: getToStringValue(props.value != null ? props.value : defaultValue),
            controlled: isControlled(props)
          };
        }
        function updateChecked(element, props) {
          var node = element;
          var checked = props.checked;
          if (checked != null) {
            setValueForProperty(node, "checked", checked, false);
          }
        }
        function updateWrapper(element, props) {
          var node = element;
          {
            var controlled = isControlled(props);
            if (!node._wrapperState.controlled && controlled && !didWarnUncontrolledToControlled) {
              error("A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://reactjs.org/link/controlled-components");
              didWarnUncontrolledToControlled = true;
            }
            if (node._wrapperState.controlled && !controlled && !didWarnControlledToUncontrolled) {
              error("A component is changing a controlled input to be uncontrolled. This is likely caused by the value changing from a defined to undefined, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://reactjs.org/link/controlled-components");
              didWarnControlledToUncontrolled = true;
            }
          }
          updateChecked(element, props);
          var value = getToStringValue(props.value);
          var type = props.type;
          if (value != null) {
            if (type === "number") {
              if (value === 0 && node.value === "" || // We explicitly want to coerce to number here if possible.
              // eslint-disable-next-line
              node.value != value) {
                node.value = toString(value);
              }
            } else if (node.value !== toString(value)) {
              node.value = toString(value);
            }
          } else if (type === "submit" || type === "reset") {
            node.removeAttribute("value");
            return;
          }
          {
            if (props.hasOwnProperty("value")) {
              setDefaultValue(node, props.type, value);
            } else if (props.hasOwnProperty("defaultValue")) {
              setDefaultValue(node, props.type, getToStringValue(props.defaultValue));
            }
          }
          {
            if (props.checked == null && props.defaultChecked != null) {
              node.defaultChecked = !!props.defaultChecked;
            }
          }
        }
        function postMountWrapper(element, props, isHydrating2) {
          var node = element;
          if (props.hasOwnProperty("value") || props.hasOwnProperty("defaultValue")) {
            var type = props.type;
            var isButton = type === "submit" || type === "reset";
            if (isButton && (props.value === void 0 || props.value === null)) {
              return;
            }
            var initialValue = toString(node._wrapperState.initialValue);
            if (!isHydrating2) {
              {
                if (initialValue !== node.value) {
                  node.value = initialValue;
                }
              }
            }
            {
              node.defaultValue = initialValue;
            }
          }
          var name = node.name;
          if (name !== "") {
            node.name = "";
          }
          {
            node.defaultChecked = !node.defaultChecked;
            node.defaultChecked = !!node._wrapperState.initialChecked;
          }
          if (name !== "") {
            node.name = name;
          }
        }
        function restoreControlledState(element, props) {
          var node = element;
          updateWrapper(node, props);
          updateNamedCousins(node, props);
        }
        function updateNamedCousins(rootNode, props) {
          var name = props.name;
          if (props.type === "radio" && name != null) {
            var queryRoot = rootNode;
            while (queryRoot.parentNode) {
              queryRoot = queryRoot.parentNode;
            }
            {
              checkAttributeStringCoercion(name, "name");
            }
            var group = queryRoot.querySelectorAll("input[name=" + JSON.stringify("" + name) + '][type="radio"]');
            for (var i = 0; i < group.length; i++) {
              var otherNode = group[i];
              if (otherNode === rootNode || otherNode.form !== rootNode.form) {
                continue;
              }
              var otherProps = getFiberCurrentPropsFromNode(otherNode);
              if (!otherProps) {
                throw new Error("ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported.");
              }
              updateValueIfChanged(otherNode);
              updateWrapper(otherNode, otherProps);
            }
          }
        }
        function setDefaultValue(node, type, value) {
          if (
            // Focused number inputs synchronize on blur. See ChangeEventPlugin.js
            type !== "number" || getActiveElement(node.ownerDocument) !== node
          ) {
            if (value == null) {
              node.defaultValue = toString(node._wrapperState.initialValue);
            } else if (node.defaultValue !== toString(value)) {
              node.defaultValue = toString(value);
            }
          }
        }
        var didWarnSelectedSetOnOption = false;
        var didWarnInvalidChild = false;
        var didWarnInvalidInnerHTML = false;
        function validateProps(element, props) {
          {
            if (props.value == null) {
              if (typeof props.children === "object" && props.children !== null) {
                React.Children.forEach(props.children, function(child) {
                  if (child == null) {
                    return;
                  }
                  if (typeof child === "string" || typeof child === "number") {
                    return;
                  }
                  if (!didWarnInvalidChild) {
                    didWarnInvalidChild = true;
                    error("Cannot infer the option value of complex children. Pass a `value` prop or use a plain string as children to <option>.");
                  }
                });
              } else if (props.dangerouslySetInnerHTML != null) {
                if (!didWarnInvalidInnerHTML) {
                  didWarnInvalidInnerHTML = true;
                  error("Pass a `value` prop if you set dangerouslyInnerHTML so React knows which value should be selected.");
                }
              }
            }
            if (props.selected != null && !didWarnSelectedSetOnOption) {
              error("Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>.");
              didWarnSelectedSetOnOption = true;
            }
          }
        }
        function postMountWrapper$1(element, props) {
          if (props.value != null) {
            element.setAttribute("value", toString(getToStringValue(props.value)));
          }
        }
        var isArrayImpl = Array.isArray;
        function isArray(a) {
          return isArrayImpl(a);
        }
        var didWarnValueDefaultValue$1;
        {
          didWarnValueDefaultValue$1 = false;
        }
        function getDeclarationErrorAddendum() {
          var ownerName = getCurrentFiberOwnerNameInDevOrNull();
          if (ownerName) {
            return "\n\nCheck the render method of `" + ownerName + "`.";
          }
          return "";
        }
        var valuePropNames = ["value", "defaultValue"];
        function checkSelectPropTypes(props) {
          {
            checkControlledValueProps("select", props);
            for (var i = 0; i < valuePropNames.length; i++) {
              var propName = valuePropNames[i];
              if (props[propName] == null) {
                continue;
              }
              var propNameIsArray = isArray(props[propName]);
              if (props.multiple && !propNameIsArray) {
                error("The `%s` prop supplied to <select> must be an array if `multiple` is true.%s", propName, getDeclarationErrorAddendum());
              } else if (!props.multiple && propNameIsArray) {
                error("The `%s` prop supplied to <select> must be a scalar value if `multiple` is false.%s", propName, getDeclarationErrorAddendum());
              }
            }
          }
        }
        function updateOptions(node, multiple, propValue, setDefaultSelected) {
          var options2 = node.options;
          if (multiple) {
            var selectedValues = propValue;
            var selectedValue = {};
            for (var i = 0; i < selectedValues.length; i++) {
              selectedValue["$" + selectedValues[i]] = true;
            }
            for (var _i = 0; _i < options2.length; _i++) {
              var selected = selectedValue.hasOwnProperty("$" + options2[_i].value);
              if (options2[_i].selected !== selected) {
                options2[_i].selected = selected;
              }
              if (selected && setDefaultSelected) {
                options2[_i].defaultSelected = true;
              }
            }
          } else {
            var _selectedValue = toString(getToStringValue(propValue));
            var defaultSelected = null;
            for (var _i2 = 0; _i2 < options2.length; _i2++) {
              if (options2[_i2].value === _selectedValue) {
                options2[_i2].selected = true;
                if (setDefaultSelected) {
                  options2[_i2].defaultSelected = true;
                }
                return;
              }
              if (defaultSelected === null && !options2[_i2].disabled) {
                defaultSelected = options2[_i2];
              }
            }
            if (defaultSelected !== null) {
              defaultSelected.selected = true;
            }
          }
        }
        function getHostProps$1(element, props) {
          return assign({}, props, {
            value: void 0
          });
        }
        function initWrapperState$1(element, props) {
          var node = element;
          {
            checkSelectPropTypes(props);
          }
          node._wrapperState = {
            wasMultiple: !!props.multiple
          };
          {
            if (props.value !== void 0 && props.defaultValue !== void 0 && !didWarnValueDefaultValue$1) {
              error("Select elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled select element and remove one of these props. More info: https://reactjs.org/link/controlled-components");
              didWarnValueDefaultValue$1 = true;
            }
          }
        }
        function postMountWrapper$2(element, props) {
          var node = element;
          node.multiple = !!props.multiple;
          var value = props.value;
          if (value != null) {
            updateOptions(node, !!props.multiple, value, false);
          } else if (props.defaultValue != null) {
            updateOptions(node, !!props.multiple, props.defaultValue, true);
          }
        }
        function postUpdateWrapper(element, props) {
          var node = element;
          var wasMultiple = node._wrapperState.wasMultiple;
          node._wrapperState.wasMultiple = !!props.multiple;
          var value = props.value;
          if (value != null) {
            updateOptions(node, !!props.multiple, value, false);
          } else if (wasMultiple !== !!props.multiple) {
            if (props.defaultValue != null) {
              updateOptions(node, !!props.multiple, props.defaultValue, true);
            } else {
              updateOptions(node, !!props.multiple, props.multiple ? [] : "", false);
            }
          }
        }
        function restoreControlledState$1(element, props) {
          var node = element;
          var value = props.value;
          if (value != null) {
            updateOptions(node, !!props.multiple, value, false);
          }
        }
        var didWarnValDefaultVal = false;
        function getHostProps$2(element, props) {
          var node = element;
          if (props.dangerouslySetInnerHTML != null) {
            throw new Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
          }
          var hostProps = assign({}, props, {
            value: void 0,
            defaultValue: void 0,
            children: toString(node._wrapperState.initialValue)
          });
          return hostProps;
        }
        function initWrapperState$2(element, props) {
          var node = element;
          {
            checkControlledValueProps("textarea", props);
            if (props.value !== void 0 && props.defaultValue !== void 0 && !didWarnValDefaultVal) {
              error("%s contains a textarea with both value and defaultValue props. Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://reactjs.org/link/controlled-components", getCurrentFiberOwnerNameInDevOrNull() || "A component");
              didWarnValDefaultVal = true;
            }
          }
          var initialValue = props.value;
          if (initialValue == null) {
            var children = props.children, defaultValue = props.defaultValue;
            if (children != null) {
              {
                error("Use the `defaultValue` or `value` props instead of setting children on <textarea>.");
              }
              {
                if (defaultValue != null) {
                  throw new Error("If you supply `defaultValue` on a <textarea>, do not pass children.");
                }
                if (isArray(children)) {
                  if (children.length > 1) {
                    throw new Error("<textarea> can only have at most one child.");
                  }
                  children = children[0];
                }
                defaultValue = children;
              }
            }
            if (defaultValue == null) {
              defaultValue = "";
            }
            initialValue = defaultValue;
          }
          node._wrapperState = {
            initialValue: getToStringValue(initialValue)
          };
        }
        function updateWrapper$1(element, props) {
          var node = element;
          var value = getToStringValue(props.value);
          var defaultValue = getToStringValue(props.defaultValue);
          if (value != null) {
            var newValue = toString(value);
            if (newValue !== node.value) {
              node.value = newValue;
            }
            if (props.defaultValue == null && node.defaultValue !== newValue) {
              node.defaultValue = newValue;
            }
          }
          if (defaultValue != null) {
            node.defaultValue = toString(defaultValue);
          }
        }
        function postMountWrapper$3(element, props) {
          var node = element;
          var textContent = node.textContent;
          if (textContent === node._wrapperState.initialValue) {
            if (textContent !== "" && textContent !== null) {
              node.value = textContent;
            }
          }
        }
        function restoreControlledState$2(element, props) {
          updateWrapper$1(element, props);
        }
        var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
        var MATH_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
        var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
        function getIntrinsicNamespace(type) {
          switch (type) {
            case "svg":
              return SVG_NAMESPACE;
            case "math":
              return MATH_NAMESPACE;
            default:
              return HTML_NAMESPACE;
          }
        }
        function getChildNamespace(parentNamespace, type) {
          if (parentNamespace == null || parentNamespace === HTML_NAMESPACE) {
            return getIntrinsicNamespace(type);
          }
          if (parentNamespace === SVG_NAMESPACE && type === "foreignObject") {
            return HTML_NAMESPACE;
          }
          return parentNamespace;
        }
        var createMicrosoftUnsafeLocalFunction = function(func) {
          if (typeof MSApp !== "undefined" && MSApp.execUnsafeLocalFunction) {
            return function(arg0, arg1, arg2, arg3) {
              MSApp.execUnsafeLocalFunction(function() {
                return func(arg0, arg1, arg2, arg3);
              });
            };
          } else {
            return func;
          }
        };
        var reusableSVGContainer;
        var setInnerHTML = createMicrosoftUnsafeLocalFunction(function(node, html) {
          if (node.namespaceURI === SVG_NAMESPACE) {
            if (!("innerHTML" in node)) {
              reusableSVGContainer = reusableSVGContainer || document.createElement("div");
              reusableSVGContainer.innerHTML = "<svg>" + html.valueOf().toString() + "</svg>";
              var svgNode = reusableSVGContainer.firstChild;
              while (node.firstChild) {
                node.removeChild(node.firstChild);
              }
              while (svgNode.firstChild) {
                node.appendChild(svgNode.firstChild);
              }
              return;
            }
          }
          node.innerHTML = html;
        });
        var ELEMENT_NODE = 1;
        var TEXT_NODE = 3;
        var COMMENT_NODE = 8;
        var DOCUMENT_NODE = 9;
        var DOCUMENT_FRAGMENT_NODE = 11;
        var setTextContent = function(node, text) {
          if (text) {
            var firstChild = node.firstChild;
            if (firstChild && firstChild === node.lastChild && firstChild.nodeType === TEXT_NODE) {
              firstChild.nodeValue = text;
              return;
            }
          }
          node.textContent = text;
        };
        var shorthandToLonghand = {
          animation: ["animationDelay", "animationDirection", "animationDuration", "animationFillMode", "animationIterationCount", "animationName", "animationPlayState", "animationTimingFunction"],
          background: ["backgroundAttachment", "backgroundClip", "backgroundColor", "backgroundImage", "backgroundOrigin", "backgroundPositionX", "backgroundPositionY", "backgroundRepeat", "backgroundSize"],
          backgroundPosition: ["backgroundPositionX", "backgroundPositionY"],
          border: ["borderBottomColor", "borderBottomStyle", "borderBottomWidth", "borderImageOutset", "borderImageRepeat", "borderImageSlice", "borderImageSource", "borderImageWidth", "borderLeftColor", "borderLeftStyle", "borderLeftWidth", "borderRightColor", "borderRightStyle", "borderRightWidth", "borderTopColor", "borderTopStyle", "borderTopWidth"],
          borderBlockEnd: ["borderBlockEndColor", "borderBlockEndStyle", "borderBlockEndWidth"],
          borderBlockStart: ["borderBlockStartColor", "borderBlockStartStyle", "borderBlockStartWidth"],
          borderBottom: ["borderBottomColor", "borderBottomStyle", "borderBottomWidth"],
          borderColor: ["borderBottomColor", "borderLeftColor", "borderRightColor", "borderTopColor"],
          borderImage: ["borderImageOutset", "borderImageRepeat", "borderImageSlice", "borderImageSource", "borderImageWidth"],
          borderInlineEnd: ["borderInlineEndColor", "borderInlineEndStyle", "borderInlineEndWidth"],
          borderInlineStart: ["borderInlineStartColor", "borderInlineStartStyle", "borderInlineStartWidth"],
          borderLeft: ["borderLeftColor", "borderLeftStyle", "borderLeftWidth"],
          borderRadius: ["borderBottomLeftRadius", "borderBottomRightRadius", "borderTopLeftRadius", "borderTopRightRadius"],
          borderRight: ["borderRightColor", "borderRightStyle", "borderRightWidth"],
          borderStyle: ["borderBottomStyle", "borderLeftStyle", "borderRightStyle", "borderTopStyle"],
          borderTop: ["borderTopColor", "borderTopStyle", "borderTopWidth"],
          borderWidth: ["borderBottomWidth", "borderLeftWidth", "borderRightWidth", "borderTopWidth"],
          columnRule: ["columnRuleColor", "columnRuleStyle", "columnRuleWidth"],
          columns: ["columnCount", "columnWidth"],
          flex: ["flexBasis", "flexGrow", "flexShrink"],
          flexFlow: ["flexDirection", "flexWrap"],
          font: ["fontFamily", "fontFeatureSettings", "fontKerning", "fontLanguageOverride", "fontSize", "fontSizeAdjust", "fontStretch", "fontStyle", "fontVariant", "fontVariantAlternates", "fontVariantCaps", "fontVariantEastAsian", "fontVariantLigatures", "fontVariantNumeric", "fontVariantPosition", "fontWeight", "lineHeight"],
          fontVariant: ["fontVariantAlternates", "fontVariantCaps", "fontVariantEastAsian", "fontVariantLigatures", "fontVariantNumeric", "fontVariantPosition"],
          gap: ["columnGap", "rowGap"],
          grid: ["gridAutoColumns", "gridAutoFlow", "gridAutoRows", "gridTemplateAreas", "gridTemplateColumns", "gridTemplateRows"],
          gridArea: ["gridColumnEnd", "gridColumnStart", "gridRowEnd", "gridRowStart"],
          gridColumn: ["gridColumnEnd", "gridColumnStart"],
          gridColumnGap: ["columnGap"],
          gridGap: ["columnGap", "rowGap"],
          gridRow: ["gridRowEnd", "gridRowStart"],
          gridRowGap: ["rowGap"],
          gridTemplate: ["gridTemplateAreas", "gridTemplateColumns", "gridTemplateRows"],
          listStyle: ["listStyleImage", "listStylePosition", "listStyleType"],
          margin: ["marginBottom", "marginLeft", "marginRight", "marginTop"],
          marker: ["markerEnd", "markerMid", "markerStart"],
          mask: ["maskClip", "maskComposite", "maskImage", "maskMode", "maskOrigin", "maskPositionX", "maskPositionY", "maskRepeat", "maskSize"],
          maskPosition: ["maskPositionX", "maskPositionY"],
          outline: ["outlineColor", "outlineStyle", "outlineWidth"],
          overflow: ["overflowX", "overflowY"],
          padding: ["paddingBottom", "paddingLeft", "paddingRight", "paddingTop"],
          placeContent: ["alignContent", "justifyContent"],
          placeItems: ["alignItems", "justifyItems"],
          placeSelf: ["alignSelf", "justifySelf"],
          textDecoration: ["textDecorationColor", "textDecorationLine", "textDecorationStyle"],
          textEmphasis: ["textEmphasisColor", "textEmphasisStyle"],
          transition: ["transitionDelay", "transitionDuration", "transitionProperty", "transitionTimingFunction"],
          wordWrap: ["overflowWrap"]
        };
        var isUnitlessNumber = {
          animationIterationCount: true,
          aspectRatio: true,
          borderImageOutset: true,
          borderImageSlice: true,
          borderImageWidth: true,
          boxFlex: true,
          boxFlexGroup: true,
          boxOrdinalGroup: true,
          columnCount: true,
          columns: true,
          flex: true,
          flexGrow: true,
          flexPositive: true,
          flexShrink: true,
          flexNegative: true,
          flexOrder: true,
          gridArea: true,
          gridRow: true,
          gridRowEnd: true,
          gridRowSpan: true,
          gridRowStart: true,
          gridColumn: true,
          gridColumnEnd: true,
          gridColumnSpan: true,
          gridColumnStart: true,
          fontWeight: true,
          lineClamp: true,
          lineHeight: true,
          opacity: true,
          order: true,
          orphans: true,
          tabSize: true,
          widows: true,
          zIndex: true,
          zoom: true,
          // SVG-related properties
          fillOpacity: true,
          floodOpacity: true,
          stopOpacity: true,
          strokeDasharray: true,
          strokeDashoffset: true,
          strokeMiterlimit: true,
          strokeOpacity: true,
          strokeWidth: true
        };
        function prefixKey(prefix2, key) {
          return prefix2 + key.charAt(0).toUpperCase() + key.substring(1);
        }
        var prefixes = ["Webkit", "ms", "Moz", "O"];
        Object.keys(isUnitlessNumber).forEach(function(prop) {
          prefixes.forEach(function(prefix2) {
            isUnitlessNumber[prefixKey(prefix2, prop)] = isUnitlessNumber[prop];
          });
        });
        function dangerousStyleValue(name, value, isCustomProperty) {
          var isEmpty = value == null || typeof value === "boolean" || value === "";
          if (isEmpty) {
            return "";
          }
          if (!isCustomProperty && typeof value === "number" && value !== 0 && !(isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name])) {
            return value + "px";
          }
          {
            checkCSSPropertyStringCoercion(value, name);
          }
          return ("" + value).trim();
        }
        var uppercasePattern = /([A-Z])/g;
        var msPattern = /^ms-/;
        function hyphenateStyleName(name) {
          return name.replace(uppercasePattern, "-$1").toLowerCase().replace(msPattern, "-ms-");
        }
        var warnValidStyle = function() {
        };
        {
          var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;
          var msPattern$1 = /^-ms-/;
          var hyphenPattern = /-(.)/g;
          var badStyleValueWithSemicolonPattern = /;\s*$/;
          var warnedStyleNames = {};
          var warnedStyleValues = {};
          var warnedForNaNValue = false;
          var warnedForInfinityValue = false;
          var camelize = function(string) {
            return string.replace(hyphenPattern, function(_, character) {
              return character.toUpperCase();
            });
          };
          var warnHyphenatedStyleName = function(name) {
            if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
              return;
            }
            warnedStyleNames[name] = true;
            error(
              "Unsupported style property %s. Did you mean %s?",
              name,
              // As Andi Smith suggests
              // (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
              // is converted to lowercase `ms`.
              camelize(name.replace(msPattern$1, "ms-"))
            );
          };
          var warnBadVendoredStyleName = function(name) {
            if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
              return;
            }
            warnedStyleNames[name] = true;
            error("Unsupported vendor-prefixed style property %s. Did you mean %s?", name, name.charAt(0).toUpperCase() + name.slice(1));
          };
          var warnStyleValueWithSemicolon = function(name, value) {
            if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
              return;
            }
            warnedStyleValues[value] = true;
            error(`Style property values shouldn't contain a semicolon. Try "%s: %s" instead.`, name, value.replace(badStyleValueWithSemicolonPattern, ""));
          };
          var warnStyleValueIsNaN = function(name, value) {
            if (warnedForNaNValue) {
              return;
            }
            warnedForNaNValue = true;
            error("`NaN` is an invalid value for the `%s` css style property.", name);
          };
          var warnStyleValueIsInfinity = function(name, value) {
            if (warnedForInfinityValue) {
              return;
            }
            warnedForInfinityValue = true;
            error("`Infinity` is an invalid value for the `%s` css style property.", name);
          };
          warnValidStyle = function(name, value) {
            if (name.indexOf("-") > -1) {
              warnHyphenatedStyleName(name);
            } else if (badVendoredStyleNamePattern.test(name)) {
              warnBadVendoredStyleName(name);
            } else if (badStyleValueWithSemicolonPattern.test(value)) {
              warnStyleValueWithSemicolon(name, value);
            }
            if (typeof value === "number") {
              if (isNaN(value)) {
                warnStyleValueIsNaN(name, value);
              } else if (!isFinite(value)) {
                warnStyleValueIsInfinity(name, value);
              }
            }
          };
        }
        var warnValidStyle$1 = warnValidStyle;
        function createDangerousStringForStyles(styles) {
          {
            var serialized = "";
            var delimiter = "";
            for (var styleName in styles) {
              if (!styles.hasOwnProperty(styleName)) {
                continue;
              }
              var styleValue = styles[styleName];
              if (styleValue != null) {
                var isCustomProperty = styleName.indexOf("--") === 0;
                serialized += delimiter + (isCustomProperty ? styleName : hyphenateStyleName(styleName)) + ":";
                serialized += dangerousStyleValue(styleName, styleValue, isCustomProperty);
                delimiter = ";";
              }
            }
            return serialized || null;
          }
        }
        function setValueForStyles(node, styles) {
          var style2 = node.style;
          for (var styleName in styles) {
            if (!styles.hasOwnProperty(styleName)) {
              continue;
            }
            var isCustomProperty = styleName.indexOf("--") === 0;
            {
              if (!isCustomProperty) {
                warnValidStyle$1(styleName, styles[styleName]);
              }
            }
            var styleValue = dangerousStyleValue(styleName, styles[styleName], isCustomProperty);
            if (styleName === "float") {
              styleName = "cssFloat";
            }
            if (isCustomProperty) {
              style2.setProperty(styleName, styleValue);
            } else {
              style2[styleName] = styleValue;
            }
          }
        }
        function isValueEmpty(value) {
          return value == null || typeof value === "boolean" || value === "";
        }
        function expandShorthandMap(styles) {
          var expanded = {};
          for (var key in styles) {
            var longhands = shorthandToLonghand[key] || [key];
            for (var i = 0; i < longhands.length; i++) {
              expanded[longhands[i]] = key;
            }
          }
          return expanded;
        }
        function validateShorthandPropertyCollisionInDev(styleUpdates, nextStyles) {
          {
            if (!nextStyles) {
              return;
            }
            var expandedUpdates = expandShorthandMap(styleUpdates);
            var expandedStyles = expandShorthandMap(nextStyles);
            var warnedAbout = {};
            for (var key in expandedUpdates) {
              var originalKey = expandedUpdates[key];
              var correctOriginalKey = expandedStyles[key];
              if (correctOriginalKey && originalKey !== correctOriginalKey) {
                var warningKey = originalKey + "," + correctOriginalKey;
                if (warnedAbout[warningKey]) {
                  continue;
                }
                warnedAbout[warningKey] = true;
                error("%s a style property during rerender (%s) when a conflicting property is set (%s) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, replace the shorthand with separate values.", isValueEmpty(styleUpdates[originalKey]) ? "Removing" : "Updating", originalKey, correctOriginalKey);
              }
            }
          }
        }
        var omittedCloseTags = {
          area: true,
          base: true,
          br: true,
          col: true,
          embed: true,
          hr: true,
          img: true,
          input: true,
          keygen: true,
          link: true,
          meta: true,
          param: true,
          source: true,
          track: true,
          wbr: true
          // NOTE: menuitem's close tag should be omitted, but that causes problems.
        };
        var voidElementTags = assign({
          menuitem: true
        }, omittedCloseTags);
        var HTML = "__html";
        function assertValidProps(tag, props) {
          if (!props) {
            return;
          }
          if (voidElementTags[tag]) {
            if (props.children != null || props.dangerouslySetInnerHTML != null) {
              throw new Error(tag + " is a void element tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
            }
          }
          if (props.dangerouslySetInnerHTML != null) {
            if (props.children != null) {
              throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
            }
            if (typeof props.dangerouslySetInnerHTML !== "object" || !(HTML in props.dangerouslySetInnerHTML)) {
              throw new Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information.");
            }
          }
          {
            if (!props.suppressContentEditableWarning && props.contentEditable && props.children != null) {
              error("A component is `contentEditable` and contains `children` managed by React. It is now your responsibility to guarantee that none of those nodes are unexpectedly modified or duplicated. This is probably not intentional.");
            }
          }
          if (props.style != null && typeof props.style !== "object") {
            throw new Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.");
          }
        }
        function isCustomComponent(tagName, props) {
          if (tagName.indexOf("-") === -1) {
            return typeof props.is === "string";
          }
          switch (tagName) {
            case "annotation-xml":
            case "color-profile":
            case "font-face":
            case "font-face-src":
            case "font-face-uri":
            case "font-face-format":
            case "font-face-name":
            case "missing-glyph":
              return false;
            default:
              return true;
          }
        }
        var possibleStandardNames = {
          // HTML
          accept: "accept",
          acceptcharset: "acceptCharset",
          "accept-charset": "acceptCharset",
          accesskey: "accessKey",
          action: "action",
          allowfullscreen: "allowFullScreen",
          alt: "alt",
          as: "as",
          async: "async",
          autocapitalize: "autoCapitalize",
          autocomplete: "autoComplete",
          autocorrect: "autoCorrect",
          autofocus: "autoFocus",
          autoplay: "autoPlay",
          autosave: "autoSave",
          capture: "capture",
          cellpadding: "cellPadding",
          cellspacing: "cellSpacing",
          challenge: "challenge",
          charset: "charSet",
          checked: "checked",
          children: "children",
          cite: "cite",
          class: "className",
          classid: "classID",
          classname: "className",
          cols: "cols",
          colspan: "colSpan",
          content: "content",
          contenteditable: "contentEditable",
          contextmenu: "contextMenu",
          controls: "controls",
          controlslist: "controlsList",
          coords: "coords",
          crossorigin: "crossOrigin",
          dangerouslysetinnerhtml: "dangerouslySetInnerHTML",
          data: "data",
          datetime: "dateTime",
          default: "default",
          defaultchecked: "defaultChecked",
          defaultvalue: "defaultValue",
          defer: "defer",
          dir: "dir",
          disabled: "disabled",
          disablepictureinpicture: "disablePictureInPicture",
          disableremoteplayback: "disableRemotePlayback",
          download: "download",
          draggable: "draggable",
          enctype: "encType",
          enterkeyhint: "enterKeyHint",
          for: "htmlFor",
          form: "form",
          formmethod: "formMethod",
          formaction: "formAction",
          formenctype: "formEncType",
          formnovalidate: "formNoValidate",
          formtarget: "formTarget",
          frameborder: "frameBorder",
          headers: "headers",
          height: "height",
          hidden: "hidden",
          high: "high",
          href: "href",
          hreflang: "hrefLang",
          htmlfor: "htmlFor",
          httpequiv: "httpEquiv",
          "http-equiv": "httpEquiv",
          icon: "icon",
          id: "id",
          imagesizes: "imageSizes",
          imagesrcset: "imageSrcSet",
          innerhtml: "innerHTML",
          inputmode: "inputMode",
          integrity: "integrity",
          is: "is",
          itemid: "itemID",
          itemprop: "itemProp",
          itemref: "itemRef",
          itemscope: "itemScope",
          itemtype: "itemType",
          keyparams: "keyParams",
          keytype: "keyType",
          kind: "kind",
          label: "label",
          lang: "lang",
          list: "list",
          loop: "loop",
          low: "low",
          manifest: "manifest",
          marginwidth: "marginWidth",
          marginheight: "marginHeight",
          max: "max",
          maxlength: "maxLength",
          media: "media",
          mediagroup: "mediaGroup",
          method: "method",
          min: "min",
          minlength: "minLength",
          multiple: "multiple",
          muted: "muted",
          name: "name",
          nomodule: "noModule",
          nonce: "nonce",
          novalidate: "noValidate",
          open: "open",
          optimum: "optimum",
          pattern: "pattern",
          placeholder: "placeholder",
          playsinline: "playsInline",
          poster: "poster",
          preload: "preload",
          profile: "profile",
          radiogroup: "radioGroup",
          readonly: "readOnly",
          referrerpolicy: "referrerPolicy",
          rel: "rel",
          required: "required",
          reversed: "reversed",
          role: "role",
          rows: "rows",
          rowspan: "rowSpan",
          sandbox: "sandbox",
          scope: "scope",
          scoped: "scoped",
          scrolling: "scrolling",
          seamless: "seamless",
          selected: "selected",
          shape: "shape",
          size: "size",
          sizes: "sizes",
          span: "span",
          spellcheck: "spellCheck",
          src: "src",
          srcdoc: "srcDoc",
          srclang: "srcLang",
          srcset: "srcSet",
          start: "start",
          step: "step",
          style: "style",
          summary: "summary",
          tabindex: "tabIndex",
          target: "target",
          title: "title",
          type: "type",
          usemap: "useMap",
          value: "value",
          width: "width",
          wmode: "wmode",
          wrap: "wrap",
          // SVG
          about: "about",
          accentheight: "accentHeight",
          "accent-height": "accentHeight",
          accumulate: "accumulate",
          additive: "additive",
          alignmentbaseline: "alignmentBaseline",
          "alignment-baseline": "alignmentBaseline",
          allowreorder: "allowReorder",
          alphabetic: "alphabetic",
          amplitude: "amplitude",
          arabicform: "arabicForm",
          "arabic-form": "arabicForm",
          ascent: "ascent",
          attributename: "attributeName",
          attributetype: "attributeType",
          autoreverse: "autoReverse",
          azimuth: "azimuth",
          basefrequency: "baseFrequency",
          baselineshift: "baselineShift",
          "baseline-shift": "baselineShift",
          baseprofile: "baseProfile",
          bbox: "bbox",
          begin: "begin",
          bias: "bias",
          by: "by",
          calcmode: "calcMode",
          capheight: "capHeight",
          "cap-height": "capHeight",
          clip: "clip",
          clippath: "clipPath",
          "clip-path": "clipPath",
          clippathunits: "clipPathUnits",
          cliprule: "clipRule",
          "clip-rule": "clipRule",
          color: "color",
          colorinterpolation: "colorInterpolation",
          "color-interpolation": "colorInterpolation",
          colorinterpolationfilters: "colorInterpolationFilters",
          "color-interpolation-filters": "colorInterpolationFilters",
          colorprofile: "colorProfile",
          "color-profile": "colorProfile",
          colorrendering: "colorRendering",
          "color-rendering": "colorRendering",
          contentscripttype: "contentScriptType",
          contentstyletype: "contentStyleType",
          cursor: "cursor",
          cx: "cx",
          cy: "cy",
          d: "d",
          datatype: "datatype",
          decelerate: "decelerate",
          descent: "descent",
          diffuseconstant: "diffuseConstant",
          direction: "direction",
          display: "display",
          divisor: "divisor",
          dominantbaseline: "dominantBaseline",
          "dominant-baseline": "dominantBaseline",
          dur: "dur",
          dx: "dx",
          dy: "dy",
          edgemode: "edgeMode",
          elevation: "elevation",
          enablebackground: "enableBackground",
          "enable-background": "enableBackground",
          end: "end",
          exponent: "exponent",
          externalresourcesrequired: "externalResourcesRequired",
          fill: "fill",
          fillopacity: "fillOpacity",
          "fill-opacity": "fillOpacity",
          fillrule: "fillRule",
          "fill-rule": "fillRule",
          filter: "filter",
          filterres: "filterRes",
          filterunits: "filterUnits",
          floodopacity: "floodOpacity",
          "flood-opacity": "floodOpacity",
          floodcolor: "floodColor",
          "flood-color": "floodColor",
          focusable: "focusable",
          fontfamily: "fontFamily",
          "font-family": "fontFamily",
          fontsize: "fontSize",
          "font-size": "fontSize",
          fontsizeadjust: "fontSizeAdjust",
          "font-size-adjust": "fontSizeAdjust",
          fontstretch: "fontStretch",
          "font-stretch": "fontStretch",
          fontstyle: "fontStyle",
          "font-style": "fontStyle",
          fontvariant: "fontVariant",
          "font-variant": "fontVariant",
          fontweight: "fontWeight",
          "font-weight": "fontWeight",
          format: "format",
          from: "from",
          fx: "fx",
          fy: "fy",
          g1: "g1",
          g2: "g2",
          glyphname: "glyphName",
          "glyph-name": "glyphName",
          glyphorientationhorizontal: "glyphOrientationHorizontal",
          "glyph-orientation-horizontal": "glyphOrientationHorizontal",
          glyphorientationvertical: "glyphOrientationVertical",
          "glyph-orientation-vertical": "glyphOrientationVertical",
          glyphref: "glyphRef",
          gradienttransform: "gradientTransform",
          gradientunits: "gradientUnits",
          hanging: "hanging",
          horizadvx: "horizAdvX",
          "horiz-adv-x": "horizAdvX",
          horizoriginx: "horizOriginX",
          "horiz-origin-x": "horizOriginX",
          ideographic: "ideographic",
          imagerendering: "imageRendering",
          "image-rendering": "imageRendering",
          in2: "in2",
          in: "in",
          inlist: "inlist",
          intercept: "intercept",
          k1: "k1",
          k2: "k2",
          k3: "k3",
          k4: "k4",
          k: "k",
          kernelmatrix: "kernelMatrix",
          kernelunitlength: "kernelUnitLength",
          kerning: "kerning",
          keypoints: "keyPoints",
          keysplines: "keySplines",
          keytimes: "keyTimes",
          lengthadjust: "lengthAdjust",
          letterspacing: "letterSpacing",
          "letter-spacing": "letterSpacing",
          lightingcolor: "lightingColor",
          "lighting-color": "lightingColor",
          limitingconeangle: "limitingConeAngle",
          local: "local",
          markerend: "markerEnd",
          "marker-end": "markerEnd",
          markerheight: "markerHeight",
          markermid: "markerMid",
          "marker-mid": "markerMid",
          markerstart: "markerStart",
          "marker-start": "markerStart",
          markerunits: "markerUnits",
          markerwidth: "markerWidth",
          mask: "mask",
          maskcontentunits: "maskContentUnits",
          maskunits: "maskUnits",
          mathematical: "mathematical",
          mode: "mode",
          numoctaves: "numOctaves",
          offset: "offset",
          opacity: "opacity",
          operator: "operator",
          order: "order",
          orient: "orient",
          orientation: "orientation",
          origin: "origin",
          overflow: "overflow",
          overlineposition: "overlinePosition",
          "overline-position": "overlinePosition",
          overlinethickness: "overlineThickness",
          "overline-thickness": "overlineThickness",
          paintorder: "paintOrder",
          "paint-order": "paintOrder",
          panose1: "panose1",
          "panose-1": "panose1",
          pathlength: "pathLength",
          patterncontentunits: "patternContentUnits",
          patterntransform: "patternTransform",
          patternunits: "patternUnits",
          pointerevents: "pointerEvents",
          "pointer-events": "pointerEvents",
          points: "points",
          pointsatx: "pointsAtX",
          pointsaty: "pointsAtY",
          pointsatz: "pointsAtZ",
          prefix: "prefix",
          preservealpha: "preserveAlpha",
          preserveaspectratio: "preserveAspectRatio",
          primitiveunits: "primitiveUnits",
          property: "property",
          r: "r",
          radius: "radius",
          refx: "refX",
          refy: "refY",
          renderingintent: "renderingIntent",
          "rendering-intent": "renderingIntent",
          repeatcount: "repeatCount",
          repeatdur: "repeatDur",
          requiredextensions: "requiredExtensions",
          requiredfeatures: "requiredFeatures",
          resource: "resource",
          restart: "restart",
          result: "result",
          results: "results",
          rotate: "rotate",
          rx: "rx",
          ry: "ry",
          scale: "scale",
          security: "security",
          seed: "seed",
          shaperendering: "shapeRendering",
          "shape-rendering": "shapeRendering",
          slope: "slope",
          spacing: "spacing",
          specularconstant: "specularConstant",
          specularexponent: "specularExponent",
          speed: "speed",
          spreadmethod: "spreadMethod",
          startoffset: "startOffset",
          stddeviation: "stdDeviation",
          stemh: "stemh",
          stemv: "stemv",
          stitchtiles: "stitchTiles",
          stopcolor: "stopColor",
          "stop-color": "stopColor",
          stopopacity: "stopOpacity",
          "stop-opacity": "stopOpacity",
          strikethroughposition: "strikethroughPosition",
          "strikethrough-position": "strikethroughPosition",
          strikethroughthickness: "strikethroughThickness",
          "strikethrough-thickness": "strikethroughThickness",
          string: "string",
          stroke: "stroke",
          strokedasharray: "strokeDasharray",
          "stroke-dasharray": "strokeDasharray",
          strokedashoffset: "strokeDashoffset",
          "stroke-dashoffset": "strokeDashoffset",
          strokelinecap: "strokeLinecap",
          "stroke-linecap": "strokeLinecap",
          strokelinejoin: "strokeLinejoin",
          "stroke-linejoin": "strokeLinejoin",
          strokemiterlimit: "strokeMiterlimit",
          "stroke-miterlimit": "strokeMiterlimit",
          strokewidth: "strokeWidth",
          "stroke-width": "strokeWidth",
          strokeopacity: "strokeOpacity",
          "stroke-opacity": "strokeOpacity",
          suppresscontenteditablewarning: "suppressContentEditableWarning",
          suppresshydrationwarning: "suppressHydrationWarning",
          surfacescale: "surfaceScale",
          systemlanguage: "systemLanguage",
          tablevalues: "tableValues",
          targetx: "targetX",
          targety: "targetY",
          textanchor: "textAnchor",
          "text-anchor": "textAnchor",
          textdecoration: "textDecoration",
          "text-decoration": "textDecoration",
          textlength: "textLength",
          textrendering: "textRendering",
          "text-rendering": "textRendering",
          to: "to",
          transform: "transform",
          typeof: "typeof",
          u1: "u1",
          u2: "u2",
          underlineposition: "underlinePosition",
          "underline-position": "underlinePosition",
          underlinethickness: "underlineThickness",
          "underline-thickness": "underlineThickness",
          unicode: "unicode",
          unicodebidi: "unicodeBidi",
          "unicode-bidi": "unicodeBidi",
          unicoderange: "unicodeRange",
          "unicode-range": "unicodeRange",
          unitsperem: "unitsPerEm",
          "units-per-em": "unitsPerEm",
          unselectable: "unselectable",
          valphabetic: "vAlphabetic",
          "v-alphabetic": "vAlphabetic",
          values: "values",
          vectoreffect: "vectorEffect",
          "vector-effect": "vectorEffect",
          version: "version",
          vertadvy: "vertAdvY",
          "vert-adv-y": "vertAdvY",
          vertoriginx: "vertOriginX",
          "vert-origin-x": "vertOriginX",
          vertoriginy: "vertOriginY",
          "vert-origin-y": "vertOriginY",
          vhanging: "vHanging",
          "v-hanging": "vHanging",
          videographic: "vIdeographic",
          "v-ideographic": "vIdeographic",
          viewbox: "viewBox",
          viewtarget: "viewTarget",
          visibility: "visibility",
          vmathematical: "vMathematical",
          "v-mathematical": "vMathematical",
          vocab: "vocab",
          widths: "widths",
          wordspacing: "wordSpacing",
          "word-spacing": "wordSpacing",
          writingmode: "writingMode",
          "writing-mode": "writingMode",
          x1: "x1",
          x2: "x2",
          x: "x",
          xchannelselector: "xChannelSelector",
          xheight: "xHeight",
          "x-height": "xHeight",
          xlinkactuate: "xlinkActuate",
          "xlink:actuate": "xlinkActuate",
          xlinkarcrole: "xlinkArcrole",
          "xlink:arcrole": "xlinkArcrole",
          xlinkhref: "xlinkHref",
          "xlink:href": "xlinkHref",
          xlinkrole: "xlinkRole",
          "xlink:role": "xlinkRole",
          xlinkshow: "xlinkShow",
          "xlink:show": "xlinkShow",
          xlinktitle: "xlinkTitle",
          "xlink:title": "xlinkTitle",
          xlinktype: "xlinkType",
          "xlink:type": "xlinkType",
          xmlbase: "xmlBase",
          "xml:base": "xmlBase",
          xmllang: "xmlLang",
          "xml:lang": "xmlLang",
          xmlns: "xmlns",
          "xml:space": "xmlSpace",
          xmlnsxlink: "xmlnsXlink",
          "xmlns:xlink": "xmlnsXlink",
          xmlspace: "xmlSpace",
          y1: "y1",
          y2: "y2",
          y: "y",
          ychannelselector: "yChannelSelector",
          z: "z",
          zoomandpan: "zoomAndPan"
        };
        var ariaProperties = {
          "aria-current": 0,
          // state
          "aria-description": 0,
          "aria-details": 0,
          "aria-disabled": 0,
          // state
          "aria-hidden": 0,
          // state
          "aria-invalid": 0,
          // state
          "aria-keyshortcuts": 0,
          "aria-label": 0,
          "aria-roledescription": 0,
          // Widget Attributes
          "aria-autocomplete": 0,
          "aria-checked": 0,
          "aria-expanded": 0,
          "aria-haspopup": 0,
          "aria-level": 0,
          "aria-modal": 0,
          "aria-multiline": 0,
          "aria-multiselectable": 0,
          "aria-orientation": 0,
          "aria-placeholder": 0,
          "aria-pressed": 0,
          "aria-readonly": 0,
          "aria-required": 0,
          "aria-selected": 0,
          "aria-sort": 0,
          "aria-valuemax": 0,
          "aria-valuemin": 0,
          "aria-valuenow": 0,
          "aria-valuetext": 0,
          // Live Region Attributes
          "aria-atomic": 0,
          "aria-busy": 0,
          "aria-live": 0,
          "aria-relevant": 0,
          // Drag-and-Drop Attributes
          "aria-dropeffect": 0,
          "aria-grabbed": 0,
          // Relationship Attributes
          "aria-activedescendant": 0,
          "aria-colcount": 0,
          "aria-colindex": 0,
          "aria-colspan": 0,
          "aria-controls": 0,
          "aria-describedby": 0,
          "aria-errormessage": 0,
          "aria-flowto": 0,
          "aria-labelledby": 0,
          "aria-owns": 0,
          "aria-posinset": 0,
          "aria-rowcount": 0,
          "aria-rowindex": 0,
          "aria-rowspan": 0,
          "aria-setsize": 0
        };
        var warnedProperties = {};
        var rARIA = new RegExp("^(aria)-[" + ATTRIBUTE_NAME_CHAR + "]*$");
        var rARIACamel = new RegExp("^(aria)[A-Z][" + ATTRIBUTE_NAME_CHAR + "]*$");
        function validateProperty(tagName, name) {
          {
            if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) {
              return true;
            }
            if (rARIACamel.test(name)) {
              var ariaName = "aria-" + name.slice(4).toLowerCase();
              var correctName = ariaProperties.hasOwnProperty(ariaName) ? ariaName : null;
              if (correctName == null) {
                error("Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.", name);
                warnedProperties[name] = true;
                return true;
              }
              if (name !== correctName) {
                error("Invalid ARIA attribute `%s`. Did you mean `%s`?", name, correctName);
                warnedProperties[name] = true;
                return true;
              }
            }
            if (rARIA.test(name)) {
              var lowerCasedName = name.toLowerCase();
              var standardName = ariaProperties.hasOwnProperty(lowerCasedName) ? lowerCasedName : null;
              if (standardName == null) {
                warnedProperties[name] = true;
                return false;
              }
              if (name !== standardName) {
                error("Unknown ARIA attribute `%s`. Did you mean `%s`?", name, standardName);
                warnedProperties[name] = true;
                return true;
              }
            }
          }
          return true;
        }
        function warnInvalidARIAProps(type, props) {
          {
            var invalidProps = [];
            for (var key in props) {
              var isValid = validateProperty(type, key);
              if (!isValid) {
                invalidProps.push(key);
              }
            }
            var unknownPropString = invalidProps.map(function(prop) {
              return "`" + prop + "`";
            }).join(", ");
            if (invalidProps.length === 1) {
              error("Invalid aria prop %s on <%s> tag. For details, see https://reactjs.org/link/invalid-aria-props", unknownPropString, type);
            } else if (invalidProps.length > 1) {
              error("Invalid aria props %s on <%s> tag. For details, see https://reactjs.org/link/invalid-aria-props", unknownPropString, type);
            }
          }
        }
        function validateProperties(type, props) {
          if (isCustomComponent(type, props)) {
            return;
          }
          warnInvalidARIAProps(type, props);
        }
        var didWarnValueNull = false;
        function validateProperties$1(type, props) {
          {
            if (type !== "input" && type !== "textarea" && type !== "select") {
              return;
            }
            if (props != null && props.value === null && !didWarnValueNull) {
              didWarnValueNull = true;
              if (type === "select" && props.multiple) {
                error("`value` prop on `%s` should not be null. Consider using an empty array when `multiple` is set to `true` to clear the component or `undefined` for uncontrolled components.", type);
              } else {
                error("`value` prop on `%s` should not be null. Consider using an empty string to clear the component or `undefined` for uncontrolled components.", type);
              }
            }
          }
        }
        var validateProperty$1 = function() {
        };
        {
          var warnedProperties$1 = {};
          var EVENT_NAME_REGEX = /^on./;
          var INVALID_EVENT_NAME_REGEX = /^on[^A-Z]/;
          var rARIA$1 = new RegExp("^(aria)-[" + ATTRIBUTE_NAME_CHAR + "]*$");
          var rARIACamel$1 = new RegExp("^(aria)[A-Z][" + ATTRIBUTE_NAME_CHAR + "]*$");
          validateProperty$1 = function(tagName, name, value, eventRegistry) {
            if (hasOwnProperty.call(warnedProperties$1, name) && warnedProperties$1[name]) {
              return true;
            }
            var lowerCasedName = name.toLowerCase();
            if (lowerCasedName === "onfocusin" || lowerCasedName === "onfocusout") {
              error("React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React.");
              warnedProperties$1[name] = true;
              return true;
            }
            if (eventRegistry != null) {
              var registrationNameDependencies2 = eventRegistry.registrationNameDependencies, possibleRegistrationNames2 = eventRegistry.possibleRegistrationNames;
              if (registrationNameDependencies2.hasOwnProperty(name)) {
                return true;
              }
              var registrationName = possibleRegistrationNames2.hasOwnProperty(lowerCasedName) ? possibleRegistrationNames2[lowerCasedName] : null;
              if (registrationName != null) {
                error("Invalid event handler property `%s`. Did you mean `%s`?", name, registrationName);
                warnedProperties$1[name] = true;
                return true;
              }
              if (EVENT_NAME_REGEX.test(name)) {
                error("Unknown event handler property `%s`. It will be ignored.", name);
                warnedProperties$1[name] = true;
                return true;
              }
            } else if (EVENT_NAME_REGEX.test(name)) {
              if (INVALID_EVENT_NAME_REGEX.test(name)) {
                error("Invalid event handler property `%s`. React events use the camelCase naming convention, for example `onClick`.", name);
              }
              warnedProperties$1[name] = true;
              return true;
            }
            if (rARIA$1.test(name) || rARIACamel$1.test(name)) {
              return true;
            }
            if (lowerCasedName === "innerhtml") {
              error("Directly setting property `innerHTML` is not permitted. For more information, lookup documentation on `dangerouslySetInnerHTML`.");
              warnedProperties$1[name] = true;
              return true;
            }
            if (lowerCasedName === "aria") {
              error("The `aria` attribute is reserved for future use in React. Pass individual `aria-` attributes instead.");
              warnedProperties$1[name] = true;
              return true;
            }
            if (lowerCasedName === "is" && value !== null && value !== void 0 && typeof value !== "string") {
              error("Received a `%s` for a string attribute `is`. If this is expected, cast the value to a string.", typeof value);
              warnedProperties$1[name] = true;
              return true;
            }
            if (typeof value === "number" && isNaN(value)) {
              error("Received NaN for the `%s` attribute. If this is expected, cast the value to a string.", name);
              warnedProperties$1[name] = true;
              return true;
            }
            var propertyInfo = getPropertyInfo(name);
            var isReserved = propertyInfo !== null && propertyInfo.type === RESERVED;
            if (possibleStandardNames.hasOwnProperty(lowerCasedName)) {
              var standardName = possibleStandardNames[lowerCasedName];
              if (standardName !== name) {
                error("Invalid DOM property `%s`. Did you mean `%s`?", name, standardName);
                warnedProperties$1[name] = true;
                return true;
              }
            } else if (!isReserved && name !== lowerCasedName) {
              error("React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.", name, lowerCasedName);
              warnedProperties$1[name] = true;
              return true;
            }
            if (typeof value === "boolean" && shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
              if (value) {
                error('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.', value, name, name, value, name);
              } else {
                error('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.', value, name, name, value, name, name, name);
              }
              warnedProperties$1[name] = true;
              return true;
            }
            if (isReserved) {
              return true;
            }
            if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
              warnedProperties$1[name] = true;
              return false;
            }
            if ((value === "false" || value === "true") && propertyInfo !== null && propertyInfo.type === BOOLEAN) {
              error("Received the string `%s` for the boolean attribute `%s`. %s Did you mean %s={%s}?", value, name, value === "false" ? "The browser will interpret it as a truthy value." : 'Although this works, it will not work as expected if you pass the string "false".', name, value);
              warnedProperties$1[name] = true;
              return true;
            }
            return true;
          };
        }
        var warnUnknownProperties = function(type, props, eventRegistry) {
          {
            var unknownProps = [];
            for (var key in props) {
              var isValid = validateProperty$1(type, key, props[key], eventRegistry);
              if (!isValid) {
                unknownProps.push(key);
              }
            }
            var unknownPropString = unknownProps.map(function(prop) {
              return "`" + prop + "`";
            }).join(", ");
            if (unknownProps.length === 1) {
              error("Invalid value for prop %s on <%s> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://reactjs.org/link/attribute-behavior ", unknownPropString, type);
            } else if (unknownProps.length > 1) {
              error("Invalid values for props %s on <%s> tag. Either remove them from the element, or pass a string or number value to keep them in the DOM. For details, see https://reactjs.org/link/attribute-behavior ", unknownPropString, type);
            }
          }
        };
        function validateProperties$2(type, props, eventRegistry) {
          if (isCustomComponent(type, props)) {
            return;
          }
          warnUnknownProperties(type, props, eventRegistry);
        }
        var IS_EVENT_HANDLE_NON_MANAGED_NODE = 1;
        var IS_NON_DELEGATED = 1 << 1;
        var IS_CAPTURE_PHASE = 1 << 2;
        var SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS = IS_EVENT_HANDLE_NON_MANAGED_NODE | IS_NON_DELEGATED | IS_CAPTURE_PHASE;
        var currentReplayingEvent = null;
        function setReplayingEvent(event) {
          {
            if (currentReplayingEvent !== null) {
              error("Expected currently replaying event to be null. This error is likely caused by a bug in React. Please file an issue.");
            }
          }
          currentReplayingEvent = event;
        }
        function resetReplayingEvent() {
          {
            if (currentReplayingEvent === null) {
              error("Expected currently replaying event to not be null. This error is likely caused by a bug in React. Please file an issue.");
            }
          }
          currentReplayingEvent = null;
        }
        function isReplayingEvent(event) {
          return event === currentReplayingEvent;
        }
        function getEventTarget(nativeEvent) {
          var target = nativeEvent.target || nativeEvent.srcElement || window;
          if (target.correspondingUseElement) {
            target = target.correspondingUseElement;
          }
          return target.nodeType === TEXT_NODE ? target.parentNode : target;
        }
        var restoreImpl = null;
        var restoreTarget = null;
        var restoreQueue = null;
        function restoreStateOfTarget(target) {
          var internalInstance = getInstanceFromNode(target);
          if (!internalInstance) {
            return;
          }
          if (typeof restoreImpl !== "function") {
            throw new Error("setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue.");
          }
          var stateNode = internalInstance.stateNode;
          if (stateNode) {
            var _props = getFiberCurrentPropsFromNode(stateNode);
            restoreImpl(internalInstance.stateNode, internalInstance.type, _props);
          }
        }
        function setRestoreImplementation(impl) {
          restoreImpl = impl;
        }
        function enqueueStateRestore(target) {
          if (restoreTarget) {
            if (restoreQueue) {
              restoreQueue.push(target);
            } else {
              restoreQueue = [target];
            }
          } else {
            restoreTarget = target;
          }
        }
        function needsStateRestore() {
          return restoreTarget !== null || restoreQueue !== null;
        }
        function restoreStateIfNeeded() {
          if (!restoreTarget) {
            return;
          }
          var target = restoreTarget;
          var queuedTargets = restoreQueue;
          restoreTarget = null;
          restoreQueue = null;
          restoreStateOfTarget(target);
          if (queuedTargets) {
            for (var i = 0; i < queuedTargets.length; i++) {
              restoreStateOfTarget(queuedTargets[i]);
            }
          }
        }
        var batchedUpdatesImpl = function(fn, bookkeeping) {
          return fn(bookkeeping);
        };
        var flushSyncImpl = function() {
        };
        var isInsideEventHandler = false;
        function finishEventHandler() {
          var controlledComponentsHavePendingUpdates = needsStateRestore();
          if (controlledComponentsHavePendingUpdates) {
            flushSyncImpl();
            restoreStateIfNeeded();
          }
        }
        function batchedUpdates(fn, a, b) {
          if (isInsideEventHandler) {
            return fn(a, b);
          }
          isInsideEventHandler = true;
          try {
            return batchedUpdatesImpl(fn, a, b);
          } finally {
            isInsideEventHandler = false;
            finishEventHandler();
          }
        }
        function setBatchingImplementation(_batchedUpdatesImpl, _discreteUpdatesImpl, _flushSyncImpl) {
          batchedUpdatesImpl = _batchedUpdatesImpl;
          flushSyncImpl = _flushSyncImpl;
        }
        function isInteractive(tag) {
          return tag === "button" || tag === "input" || tag === "select" || tag === "textarea";
        }
        function shouldPreventMouseEvent(name, type, props) {
          switch (name) {
            case "onClick":
            case "onClickCapture":
            case "onDoubleClick":
            case "onDoubleClickCapture":
            case "onMouseDown":
            case "onMouseDownCapture":
            case "onMouseMove":
            case "onMouseMoveCapture":
            case "onMouseUp":
            case "onMouseUpCapture":
            case "onMouseEnter":
              return !!(props.disabled && isInteractive(type));
            default:
              return false;
          }
        }
        function getListener(inst, registrationName) {
          var stateNode = inst.stateNode;
          if (stateNode === null) {
            return null;
          }
          var props = getFiberCurrentPropsFromNode(stateNode);
          if (props === null) {
            return null;
          }
          var listener = props[registrationName];
          if (shouldPreventMouseEvent(registrationName, inst.type, props)) {
            return null;
          }
          if (listener && typeof listener !== "function") {
            throw new Error("Expected `" + registrationName + "` listener to be a function, instead got a value of `" + typeof listener + "` type.");
          }
          return listener;
        }
        var passiveBrowserEventsSupported = false;
        if (canUseDOM) {
          try {
            var options = {};
            Object.defineProperty(options, "passive", {
              get: function() {
                passiveBrowserEventsSupported = true;
              }
            });
            window.addEventListener("test", options, options);
            window.removeEventListener("test", options, options);
          } catch (e) {
            passiveBrowserEventsSupported = false;
          }
        }
        function invokeGuardedCallbackProd(name, func, context, a, b, c, d, e, f) {
          var funcArgs = Array.prototype.slice.call(arguments, 3);
          try {
            func.apply(context, funcArgs);
          } catch (error2) {
            this.onError(error2);
          }
        }
        var invokeGuardedCallbackImpl = invokeGuardedCallbackProd;
        {
          if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof document !== "undefined" && typeof document.createEvent === "function") {
            var fakeNode = document.createElement("react");
            invokeGuardedCallbackImpl = function invokeGuardedCallbackDev(name, func, context, a, b, c, d, e, f) {
              if (typeof document === "undefined" || document === null) {
                throw new Error("The `document` global was defined when React was initialized, but is not defined anymore. This can happen in a test environment if a component schedules an update from an asynchronous callback, but the test has already finished running. To solve this, you can either unmount the component at the end of your test (and ensure that any asynchronous operations get canceled in `componentWillUnmount`), or you can change the test itself to be asynchronous.");
              }
              var evt = document.createEvent("Event");
              var didCall = false;
              var didError = true;
              var windowEvent = window.event;
              var windowEventDescriptor = Object.getOwnPropertyDescriptor(window, "event");
              function restoreAfterDispatch() {
                fakeNode.removeEventListener(evtType, callCallback2, false);
                if (typeof window.event !== "undefined" && window.hasOwnProperty("event")) {
                  window.event = windowEvent;
                }
              }
              var funcArgs = Array.prototype.slice.call(arguments, 3);
              function callCallback2() {
                didCall = true;
                restoreAfterDispatch();
                func.apply(context, funcArgs);
                didError = false;
              }
              var error2;
              var didSetError = false;
              var isCrossOriginError = false;
              function handleWindowError(event) {
                error2 = event.error;
                didSetError = true;
                if (error2 === null && event.colno === 0 && event.lineno === 0) {
                  isCrossOriginError = true;
                }
                if (event.defaultPrevented) {
                  if (error2 != null && typeof error2 === "object") {
                    try {
                      error2._suppressLogging = true;
                    } catch (inner) {
                    }
                  }
                }
              }
              var evtType = "react-" + (name ? name : "invokeguardedcallback");
              window.addEventListener("error", handleWindowError);
              fakeNode.addEventListener(evtType, callCallback2, false);
              evt.initEvent(evtType, false, false);
              fakeNode.dispatchEvent(evt);
              if (windowEventDescriptor) {
                Object.defineProperty(window, "event", windowEventDescriptor);
              }
              if (didCall && didError) {
                if (!didSetError) {
                  error2 = new Error(`An error was thrown inside one of your components, but React doesn't know what it was. This is likely due to browser flakiness. React does its best to preserve the "Pause on exceptions" behavior of the DevTools, which requires some DEV-mode only tricks. It's possible that these don't work in your browser. Try triggering the error in production mode, or switching to a modern browser. If you suspect that this is actually an issue with React, please file an issue.`);
                } else if (isCrossOriginError) {
                  error2 = new Error("A cross-origin error was thrown. React doesn't have access to the actual error object in development. See https://reactjs.org/link/crossorigin-error for more information.");
                }
                this.onError(error2);
              }
              window.removeEventListener("error", handleWindowError);
              if (!didCall) {
                restoreAfterDispatch();
                return invokeGuardedCallbackProd.apply(this, arguments);
              }
            };
          }
        }
        var invokeGuardedCallbackImpl$1 = invokeGuardedCallbackImpl;
        var hasError = false;
        var caughtError = null;
        var hasRethrowError = false;
        var rethrowError = null;
        var reporter = {
          onError: function(error2) {
            hasError = true;
            caughtError = error2;
          }
        };
        function invokeGuardedCallback(name, func, context, a, b, c, d, e, f) {
          hasError = false;
          caughtError = null;
          invokeGuardedCallbackImpl$1.apply(reporter, arguments);
        }
        function invokeGuardedCallbackAndCatchFirstError(name, func, context, a, b, c, d, e, f) {
          invokeGuardedCallback.apply(this, arguments);
          if (hasError) {
            var error2 = clearCaughtError();
            if (!hasRethrowError) {
              hasRethrowError = true;
              rethrowError = error2;
            }
          }
        }
        function rethrowCaughtError() {
          if (hasRethrowError) {
            var error2 = rethrowError;
            hasRethrowError = false;
            rethrowError = null;
            throw error2;
          }
        }
        function hasCaughtError() {
          return hasError;
        }
        function clearCaughtError() {
          if (hasError) {
            var error2 = caughtError;
            hasError = false;
            caughtError = null;
            return error2;
          } else {
            throw new Error("clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue.");
          }
        }
        function get(key) {
          return key._reactInternals;
        }
        function has(key) {
          return key._reactInternals !== void 0;
        }
        function set(key, value) {
          key._reactInternals = value;
        }
        var NoFlags = (
          /*                      */
          0
        );
        var PerformedWork = (
          /*                */
          1
        );
        var Placement = (
          /*                    */
          2
        );
        var Update = (
          /*                       */
          4
        );
        var ChildDeletion = (
          /*                */
          16
        );
        var ContentReset = (
          /*                 */
          32
        );
        var Callback = (
          /*                     */
          64
        );
        var DidCapture = (
          /*                   */
          128
        );
        var ForceClientRender = (
          /*            */
          256
        );
        var Ref = (
          /*                          */
          512
        );
        var Snapshot = (
          /*                     */
          1024
        );
        var Passive = (
          /*                      */
          2048
        );
        var Hydrating = (
          /*                    */
          4096
        );
        var Visibility = (
          /*                   */
          8192
        );
        var StoreConsistency = (
          /*             */
          16384
        );
        var LifecycleEffectMask = Passive | Update | Callback | Ref | Snapshot | StoreConsistency;
        var HostEffectMask = (
          /*               */
          32767
        );
        var Incomplete = (
          /*                   */
          32768
        );
        var ShouldCapture = (
          /*                */
          65536
        );
        var ForceUpdateForLegacySuspense = (
          /* */
          131072
        );
        var Forked = (
          /*                       */
          1048576
        );
        var RefStatic = (
          /*                    */
          2097152
        );
        var LayoutStatic = (
          /*                 */
          4194304
        );
        var PassiveStatic = (
          /*                */
          8388608
        );
        var MountLayoutDev = (
          /*               */
          16777216
        );
        var MountPassiveDev = (
          /*              */
          33554432
        );
        var BeforeMutationMask = (
          // TODO: Remove Update flag from before mutation phase by re-landing Visibility
          // flag logic (see #20043)
          Update | Snapshot | 0
        );
        var MutationMask = Placement | Update | ChildDeletion | ContentReset | Ref | Hydrating | Visibility;
        var LayoutMask = Update | Callback | Ref | Visibility;
        var PassiveMask = Passive | ChildDeletion;
        var StaticMask = LayoutStatic | PassiveStatic | RefStatic;
        var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
        function getNearestMountedFiber(fiber) {
          var node = fiber;
          var nearestMounted = fiber;
          if (!fiber.alternate) {
            var nextNode = node;
            do {
              node = nextNode;
              if ((node.flags & (Placement | Hydrating)) !== NoFlags) {
                nearestMounted = node.return;
              }
              nextNode = node.return;
            } while (nextNode);
          } else {
            while (node.return) {
              node = node.return;
            }
          }
          if (node.tag === HostRoot) {
            return nearestMounted;
          }
          return null;
        }
        function getSuspenseInstanceFromFiber(fiber) {
          if (fiber.tag === SuspenseComponent) {
            var suspenseState = fiber.memoizedState;
            if (suspenseState === null) {
              var current2 = fiber.alternate;
              if (current2 !== null) {
                suspenseState = current2.memoizedState;
              }
            }
            if (suspenseState !== null) {
              return suspenseState.dehydrated;
            }
          }
          return null;
        }
        function getContainerFromFiber(fiber) {
          return fiber.tag === HostRoot ? fiber.stateNode.containerInfo : null;
        }
        function isFiberMounted(fiber) {
          return getNearestMountedFiber(fiber) === fiber;
        }
        function isMounted(component) {
          {
            var owner = ReactCurrentOwner.current;
            if (owner !== null && owner.tag === ClassComponent) {
              var ownerFiber = owner;
              var instance = ownerFiber.stateNode;
              if (!instance._warnedAboutRefsInRender) {
                error("%s is accessing isMounted inside its render() function. render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", getComponentNameFromFiber(ownerFiber) || "A component");
              }
              instance._warnedAboutRefsInRender = true;
            }
          }
          var fiber = get(component);
          if (!fiber) {
            return false;
          }
          return getNearestMountedFiber(fiber) === fiber;
        }
        function assertIsMounted(fiber) {
          if (getNearestMountedFiber(fiber) !== fiber) {
            throw new Error("Unable to find node on an unmounted component.");
          }
        }
        function findCurrentFiberUsingSlowPath(fiber) {
          var alternate = fiber.alternate;
          if (!alternate) {
            var nearestMounted = getNearestMountedFiber(fiber);
            if (nearestMounted === null) {
              throw new Error("Unable to find node on an unmounted component.");
            }
            if (nearestMounted !== fiber) {
              return null;
            }
            return fiber;
          }
          var a = fiber;
          var b = alternate;
          while (true) {
            var parentA = a.return;
            if (parentA === null) {
              break;
            }
            var parentB = parentA.alternate;
            if (parentB === null) {
              var nextParent = parentA.return;
              if (nextParent !== null) {
                a = b = nextParent;
                continue;
              }
              break;
            }
            if (parentA.child === parentB.child) {
              var child = parentA.child;
              while (child) {
                if (child === a) {
                  assertIsMounted(parentA);
                  return fiber;
                }
                if (child === b) {
                  assertIsMounted(parentA);
                  return alternate;
                }
                child = child.sibling;
              }
              throw new Error("Unable to find node on an unmounted component.");
            }
            if (a.return !== b.return) {
              a = parentA;
              b = parentB;
            } else {
              var didFindChild = false;
              var _child = parentA.child;
              while (_child) {
                if (_child === a) {
                  didFindChild = true;
                  a = parentA;
                  b = parentB;
                  break;
                }
                if (_child === b) {
                  didFindChild = true;
                  b = parentA;
                  a = parentB;
                  break;
                }
                _child = _child.sibling;
              }
              if (!didFindChild) {
                _child = parentB.child;
                while (_child) {
                  if (_child === a) {
                    didFindChild = true;
                    a = parentB;
                    b = parentA;
                    break;
                  }
                  if (_child === b) {
                    didFindChild = true;
                    b = parentB;
                    a = parentA;
                    break;
                  }
                  _child = _child.sibling;
                }
                if (!didFindChild) {
                  throw new Error("Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue.");
                }
              }
            }
            if (a.alternate !== b) {
              throw new Error("Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue.");
            }
          }
          if (a.tag !== HostRoot) {
            throw new Error("Unable to find node on an unmounted component.");
          }
          if (a.stateNode.current === a) {
            return fiber;
          }
          return alternate;
        }
        function findCurrentHostFiber(parent) {
          var currentParent = findCurrentFiberUsingSlowPath(parent);
          return currentParent !== null ? findCurrentHostFiberImpl(currentParent) : null;
        }
        function findCurrentHostFiberImpl(node) {
          if (node.tag === HostComponent || node.tag === HostText) {
            return node;
          }
          var child = node.child;
          while (child !== null) {
            var match = findCurrentHostFiberImpl(child);
            if (match !== null) {
              return match;
            }
            child = child.sibling;
          }
          return null;
        }
        function findCurrentHostFiberWithNoPortals(parent) {
          var currentParent = findCurrentFiberUsingSlowPath(parent);
          return currentParent !== null ? findCurrentHostFiberWithNoPortalsImpl(currentParent) : null;
        }
        function findCurrentHostFiberWithNoPortalsImpl(node) {
          if (node.tag === HostComponent || node.tag === HostText) {
            return node;
          }
          var child = node.child;
          while (child !== null) {
            if (child.tag !== HostPortal) {
              var match = findCurrentHostFiberWithNoPortalsImpl(child);
              if (match !== null) {
                return match;
              }
            }
            child = child.sibling;
          }
          return null;
        }
        var scheduleCallback = Scheduler.unstable_scheduleCallback;
        var cancelCallback = Scheduler.unstable_cancelCallback;
        var shouldYield = Scheduler.unstable_shouldYield;
        var requestPaint = Scheduler.unstable_requestPaint;
        var now = Scheduler.unstable_now;
        var getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel;
        var ImmediatePriority = Scheduler.unstable_ImmediatePriority;
        var UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
        var NormalPriority = Scheduler.unstable_NormalPriority;
        var LowPriority = Scheduler.unstable_LowPriority;
        var IdlePriority = Scheduler.unstable_IdlePriority;
        var unstable_yieldValue = Scheduler.unstable_yieldValue;
        var unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue;
        var rendererID = null;
        var injectedHook = null;
        var injectedProfilingHooks = null;
        var hasLoggedError = false;
        var isDevToolsPresent = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined";
        function injectInternals(internals) {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined") {
            return false;
          }
          var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (hook.isDisabled) {
            return true;
          }
          if (!hook.supportsFiber) {
            {
              error("The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://reactjs.org/link/react-devtools");
            }
            return true;
          }
          try {
            if (enableSchedulingProfiler) {
              internals = assign({}, internals, {
                getLaneLabelMap,
                injectProfilingHooks
              });
            }
            rendererID = hook.inject(internals);
            injectedHook = hook;
          } catch (err) {
            {
              error("React instrumentation encountered an error: %s.", err);
            }
          }
          if (hook.checkDCE) {
            return true;
          } else {
            return false;
          }
        }
        function onScheduleRoot(root2, children) {
          {
            if (injectedHook && typeof injectedHook.onScheduleFiberRoot === "function") {
              try {
                injectedHook.onScheduleFiberRoot(rendererID, root2, children);
              } catch (err) {
                if (!hasLoggedError) {
                  hasLoggedError = true;
                  error("React instrumentation encountered an error: %s", err);
                }
              }
            }
          }
        }
        function onCommitRoot(root2, eventPriority) {
          if (injectedHook && typeof injectedHook.onCommitFiberRoot === "function") {
            try {
              var didError = (root2.current.flags & DidCapture) === DidCapture;
              if (enableProfilerTimer) {
                var schedulerPriority;
                switch (eventPriority) {
                  case DiscreteEventPriority:
                    schedulerPriority = ImmediatePriority;
                    break;
                  case ContinuousEventPriority:
                    schedulerPriority = UserBlockingPriority;
                    break;
                  case DefaultEventPriority:
                    schedulerPriority = NormalPriority;
                    break;
                  case IdleEventPriority:
                    schedulerPriority = IdlePriority;
                    break;
                  default:
                    schedulerPriority = NormalPriority;
                    break;
                }
                injectedHook.onCommitFiberRoot(rendererID, root2, schedulerPriority, didError);
              } else {
                injectedHook.onCommitFiberRoot(rendererID, root2, void 0, didError);
              }
            } catch (err) {
              {
                if (!hasLoggedError) {
                  hasLoggedError = true;
                  error("React instrumentation encountered an error: %s", err);
                }
              }
            }
          }
        }
        function onPostCommitRoot(root2) {
          if (injectedHook && typeof injectedHook.onPostCommitFiberRoot === "function") {
            try {
              injectedHook.onPostCommitFiberRoot(rendererID, root2);
            } catch (err) {
              {
                if (!hasLoggedError) {
                  hasLoggedError = true;
                  error("React instrumentation encountered an error: %s", err);
                }
              }
            }
          }
        }
        function onCommitUnmount(fiber) {
          if (injectedHook && typeof injectedHook.onCommitFiberUnmount === "function") {
            try {
              injectedHook.onCommitFiberUnmount(rendererID, fiber);
            } catch (err) {
              {
                if (!hasLoggedError) {
                  hasLoggedError = true;
                  error("React instrumentation encountered an error: %s", err);
                }
              }
            }
          }
        }
        function setIsStrictModeForDevtools(newIsStrictMode) {
          {
            if (typeof unstable_yieldValue === "function") {
              unstable_setDisableYieldValue(newIsStrictMode);
              setSuppressWarning(newIsStrictMode);
            }
            if (injectedHook && typeof injectedHook.setStrictMode === "function") {
              try {
                injectedHook.setStrictMode(rendererID, newIsStrictMode);
              } catch (err) {
                {
                  if (!hasLoggedError) {
                    hasLoggedError = true;
                    error("React instrumentation encountered an error: %s", err);
                  }
                }
              }
            }
          }
        }
        function injectProfilingHooks(profilingHooks) {
          injectedProfilingHooks = profilingHooks;
        }
        function getLaneLabelMap() {
          {
            var map = /* @__PURE__ */ new Map();
            var lane = 1;
            for (var index2 = 0; index2 < TotalLanes; index2++) {
              var label = getLabelForLane(lane);
              map.set(lane, label);
              lane *= 2;
            }
            return map;
          }
        }
        function markCommitStarted(lanes) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markCommitStarted === "function") {
              injectedProfilingHooks.markCommitStarted(lanes);
            }
          }
        }
        function markCommitStopped() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markCommitStopped === "function") {
              injectedProfilingHooks.markCommitStopped();
            }
          }
        }
        function markComponentRenderStarted(fiber) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentRenderStarted === "function") {
              injectedProfilingHooks.markComponentRenderStarted(fiber);
            }
          }
        }
        function markComponentRenderStopped() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentRenderStopped === "function") {
              injectedProfilingHooks.markComponentRenderStopped();
            }
          }
        }
        function markComponentPassiveEffectMountStarted(fiber) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectMountStarted === "function") {
              injectedProfilingHooks.markComponentPassiveEffectMountStarted(fiber);
            }
          }
        }
        function markComponentPassiveEffectMountStopped() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectMountStopped === "function") {
              injectedProfilingHooks.markComponentPassiveEffectMountStopped();
            }
          }
        }
        function markComponentPassiveEffectUnmountStarted(fiber) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStarted === "function") {
              injectedProfilingHooks.markComponentPassiveEffectUnmountStarted(fiber);
            }
          }
        }
        function markComponentPassiveEffectUnmountStopped() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStopped === "function") {
              injectedProfilingHooks.markComponentPassiveEffectUnmountStopped();
            }
          }
        }
        function markComponentLayoutEffectMountStarted(fiber) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectMountStarted === "function") {
              injectedProfilingHooks.markComponentLayoutEffectMountStarted(fiber);
            }
          }
        }
        function markComponentLayoutEffectMountStopped() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectMountStopped === "function") {
              injectedProfilingHooks.markComponentLayoutEffectMountStopped();
            }
          }
        }
        function markComponentLayoutEffectUnmountStarted(fiber) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStarted === "function") {
              injectedProfilingHooks.markComponentLayoutEffectUnmountStarted(fiber);
            }
          }
        }
        function markComponentLayoutEffectUnmountStopped() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStopped === "function") {
              injectedProfilingHooks.markComponentLayoutEffectUnmountStopped();
            }
          }
        }
        function markComponentErrored(fiber, thrownValue, lanes) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentErrored === "function") {
              injectedProfilingHooks.markComponentErrored(fiber, thrownValue, lanes);
            }
          }
        }
        function markComponentSuspended(fiber, wakeable, lanes) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentSuspended === "function") {
              injectedProfilingHooks.markComponentSuspended(fiber, wakeable, lanes);
            }
          }
        }
        function markLayoutEffectsStarted(lanes) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markLayoutEffectsStarted === "function") {
              injectedProfilingHooks.markLayoutEffectsStarted(lanes);
            }
          }
        }
        function markLayoutEffectsStopped() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markLayoutEffectsStopped === "function") {
              injectedProfilingHooks.markLayoutEffectsStopped();
            }
          }
        }
        function markPassiveEffectsStarted(lanes) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markPassiveEffectsStarted === "function") {
              injectedProfilingHooks.markPassiveEffectsStarted(lanes);
            }
          }
        }
        function markPassiveEffectsStopped() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markPassiveEffectsStopped === "function") {
              injectedProfilingHooks.markPassiveEffectsStopped();
            }
          }
        }
        function markRenderStarted(lanes) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderStarted === "function") {
              injectedProfilingHooks.markRenderStarted(lanes);
            }
          }
        }
        function markRenderYielded() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderYielded === "function") {
              injectedProfilingHooks.markRenderYielded();
            }
          }
        }
        function markRenderStopped() {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderStopped === "function") {
              injectedProfilingHooks.markRenderStopped();
            }
          }
        }
        function markRenderScheduled(lane) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderScheduled === "function") {
              injectedProfilingHooks.markRenderScheduled(lane);
            }
          }
        }
        function markForceUpdateScheduled(fiber, lane) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markForceUpdateScheduled === "function") {
              injectedProfilingHooks.markForceUpdateScheduled(fiber, lane);
            }
          }
        }
        function markStateUpdateScheduled(fiber, lane) {
          {
            if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markStateUpdateScheduled === "function") {
              injectedProfilingHooks.markStateUpdateScheduled(fiber, lane);
            }
          }
        }
        var NoMode = (
          /*                         */
          0
        );
        var ConcurrentMode = (
          /*                 */
          1
        );
        var ProfileMode = (
          /*                    */
          2
        );
        var StrictLegacyMode = (
          /*               */
          8
        );
        var StrictEffectsMode = (
          /*              */
          16
        );
        var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;
        var log = Math.log;
        var LN2 = Math.LN2;
        function clz32Fallback(x) {
          var asUint = x >>> 0;
          if (asUint === 0) {
            return 32;
          }
          return 31 - (log(asUint) / LN2 | 0) | 0;
        }
        var TotalLanes = 31;
        var NoLanes = (
          /*                        */
          0
        );
        var NoLane = (
          /*                          */
          0
        );
        var SyncLane = (
          /*                        */
          1
        );
        var InputContinuousHydrationLane = (
          /*    */
          2
        );
        var InputContinuousLane = (
          /*             */
          4
        );
        var DefaultHydrationLane = (
          /*            */
          8
        );
        var DefaultLane = (
          /*                     */
          16
        );
        var TransitionHydrationLane = (
          /*                */
          32
        );
        var TransitionLanes = (
          /*                       */
          4194240
        );
        var TransitionLane1 = (
          /*                        */
          64
        );
        var TransitionLane2 = (
          /*                        */
          128
        );
        var TransitionLane3 = (
          /*                        */
          256
        );
        var TransitionLane4 = (
          /*                        */
          512
        );
        var TransitionLane5 = (
          /*                        */
          1024
        );
        var TransitionLane6 = (
          /*                        */
          2048
        );
        var TransitionLane7 = (
          /*                        */
          4096
        );
        var TransitionLane8 = (
          /*                        */
          8192
        );
        var TransitionLane9 = (
          /*                        */
          16384
        );
        var TransitionLane10 = (
          /*                       */
          32768
        );
        var TransitionLane11 = (
          /*                       */
          65536
        );
        var TransitionLane12 = (
          /*                       */
          131072
        );
        var TransitionLane13 = (
          /*                       */
          262144
        );
        var TransitionLane14 = (
          /*                       */
          524288
        );
        var TransitionLane15 = (
          /*                       */
          1048576
        );
        var TransitionLane16 = (
          /*                       */
          2097152
        );
        var RetryLanes = (
          /*                            */
          130023424
        );
        var RetryLane1 = (
          /*                             */
          4194304
        );
        var RetryLane2 = (
          /*                             */
          8388608
        );
        var RetryLane3 = (
          /*                             */
          16777216
        );
        var RetryLane4 = (
          /*                             */
          33554432
        );
        var RetryLane5 = (
          /*                             */
          67108864
        );
        var SomeRetryLane = RetryLane1;
        var SelectiveHydrationLane = (
          /*          */
          134217728
        );
        var NonIdleLanes = (
          /*                          */
          268435455
        );
        var IdleHydrationLane = (
          /*               */
          268435456
        );
        var IdleLane = (
          /*                        */
          536870912
        );
        var OffscreenLane = (
          /*                   */
          1073741824
        );
        function getLabelForLane(lane) {
          {
            if (lane & SyncLane) {
              return "Sync";
            }
            if (lane & InputContinuousHydrationLane) {
              return "InputContinuousHydration";
            }
            if (lane & InputContinuousLane) {
              return "InputContinuous";
            }
            if (lane & DefaultHydrationLane) {
              return "DefaultHydration";
            }
            if (lane & DefaultLane) {
              return "Default";
            }
            if (lane & TransitionHydrationLane) {
              return "TransitionHydration";
            }
            if (lane & TransitionLanes) {
              return "Transition";
            }
            if (lane & RetryLanes) {
              return "Retry";
            }
            if (lane & SelectiveHydrationLane) {
              return "SelectiveHydration";
            }
            if (lane & IdleHydrationLane) {
              return "IdleHydration";
            }
            if (lane & IdleLane) {
              return "Idle";
            }
            if (lane & OffscreenLane) {
              return "Offscreen";
            }
          }
        }
        var NoTimestamp = -1;
        var nextTransitionLane = TransitionLane1;
        var nextRetryLane = RetryLane1;
        function getHighestPriorityLanes(lanes) {
          switch (getHighestPriorityLane(lanes)) {
            case SyncLane:
              return SyncLane;
            case InputContinuousHydrationLane:
              return InputContinuousHydrationLane;
            case InputContinuousLane:
              return InputContinuousLane;
            case DefaultHydrationLane:
              return DefaultHydrationLane;
            case DefaultLane:
              return DefaultLane;
            case TransitionHydrationLane:
              return TransitionHydrationLane;
            case TransitionLane1:
            case TransitionLane2:
            case TransitionLane3:
            case TransitionLane4:
            case TransitionLane5:
            case TransitionLane6:
            case TransitionLane7:
            case TransitionLane8:
            case TransitionLane9:
            case TransitionLane10:
            case TransitionLane11:
            case TransitionLane12:
            case TransitionLane13:
            case TransitionLane14:
            case TransitionLane15:
            case TransitionLane16:
              return lanes & TransitionLanes;
            case RetryLane1:
            case RetryLane2:
            case RetryLane3:
            case RetryLane4:
            case RetryLane5:
              return lanes & RetryLanes;
            case SelectiveHydrationLane:
              return SelectiveHydrationLane;
            case IdleHydrationLane:
              return IdleHydrationLane;
            case IdleLane:
              return IdleLane;
            case OffscreenLane:
              return OffscreenLane;
            default:
              {
                error("Should have found matching lanes. This is a bug in React.");
              }
              return lanes;
          }
        }
        function getNextLanes(root2, wipLanes) {
          var pendingLanes = root2.pendingLanes;
          if (pendingLanes === NoLanes) {
            return NoLanes;
          }
          var nextLanes = NoLanes;
          var suspendedLanes = root2.suspendedLanes;
          var pingedLanes = root2.pingedLanes;
          var nonIdlePendingLanes = pendingLanes & NonIdleLanes;
          if (nonIdlePendingLanes !== NoLanes) {
            var nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
            if (nonIdleUnblockedLanes !== NoLanes) {
              nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
            } else {
              var nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;
              if (nonIdlePingedLanes !== NoLanes) {
                nextLanes = getHighestPriorityLanes(nonIdlePingedLanes);
              }
            }
          } else {
            var unblockedLanes = pendingLanes & ~suspendedLanes;
            if (unblockedLanes !== NoLanes) {
              nextLanes = getHighestPriorityLanes(unblockedLanes);
            } else {
              if (pingedLanes !== NoLanes) {
                nextLanes = getHighestPriorityLanes(pingedLanes);
              }
            }
          }
          if (nextLanes === NoLanes) {
            return NoLanes;
          }
          if (wipLanes !== NoLanes && wipLanes !== nextLanes && // If we already suspended with a delay, then interrupting is fine. Don't
          // bother waiting until the root is complete.
          (wipLanes & suspendedLanes) === NoLanes) {
            var nextLane = getHighestPriorityLane(nextLanes);
            var wipLane = getHighestPriorityLane(wipLanes);
            if (
              // Tests whether the next lane is equal or lower priority than the wip
              // one. This works because the bits decrease in priority as you go left.
              nextLane >= wipLane || // Default priority updates should not interrupt transition updates. The
              // only difference between default updates and transition updates is that
              // default updates do not support refresh transitions.
              nextLane === DefaultLane && (wipLane & TransitionLanes) !== NoLanes
            ) {
              return wipLanes;
            }
          }
          if ((nextLanes & InputContinuousLane) !== NoLanes) {
            nextLanes |= pendingLanes & DefaultLane;
          }
          var entangledLanes = root2.entangledLanes;
          if (entangledLanes !== NoLanes) {
            var entanglements = root2.entanglements;
            var lanes = nextLanes & entangledLanes;
            while (lanes > 0) {
              var index2 = pickArbitraryLaneIndex(lanes);
              var lane = 1 << index2;
              nextLanes |= entanglements[index2];
              lanes &= ~lane;
            }
          }
          return nextLanes;
        }
        function getMostRecentEventTime(root2, lanes) {
          var eventTimes = root2.eventTimes;
          var mostRecentEventTime = NoTimestamp;
          while (lanes > 0) {
            var index2 = pickArbitraryLaneIndex(lanes);
            var lane = 1 << index2;
            var eventTime = eventTimes[index2];
            if (eventTime > mostRecentEventTime) {
              mostRecentEventTime = eventTime;
            }
            lanes &= ~lane;
          }
          return mostRecentEventTime;
        }
        function computeExpirationTime(lane, currentTime) {
          switch (lane) {
            case SyncLane:
            case InputContinuousHydrationLane:
            case InputContinuousLane:
              return currentTime + 250;
            case DefaultHydrationLane:
            case DefaultLane:
            case TransitionHydrationLane:
            case TransitionLane1:
            case TransitionLane2:
            case TransitionLane3:
            case TransitionLane4:
            case TransitionLane5:
            case TransitionLane6:
            case TransitionLane7:
            case TransitionLane8:
            case TransitionLane9:
            case TransitionLane10:
            case TransitionLane11:
            case TransitionLane12:
            case TransitionLane13:
            case TransitionLane14:
            case TransitionLane15:
            case TransitionLane16:
              return currentTime + 5e3;
            case RetryLane1:
            case RetryLane2:
            case RetryLane3:
            case RetryLane4:
            case RetryLane5:
              return NoTimestamp;
            case SelectiveHydrationLane:
            case IdleHydrationLane:
            case IdleLane:
            case OffscreenLane:
              return NoTimestamp;
            default:
              {
                error("Should have found matching lanes. This is a bug in React.");
              }
              return NoTimestamp;
          }
        }
        function markStarvedLanesAsExpired(root2, currentTime) {
          var pendingLanes = root2.pendingLanes;
          var suspendedLanes = root2.suspendedLanes;
          var pingedLanes = root2.pingedLanes;
          var expirationTimes = root2.expirationTimes;
          var lanes = pendingLanes;
          while (lanes > 0) {
            var index2 = pickArbitraryLaneIndex(lanes);
            var lane = 1 << index2;
            var expirationTime = expirationTimes[index2];
            if (expirationTime === NoTimestamp) {
              if ((lane & suspendedLanes) === NoLanes || (lane & pingedLanes) !== NoLanes) {
                expirationTimes[index2] = computeExpirationTime(lane, currentTime);
              }
            } else if (expirationTime <= currentTime) {
              root2.expiredLanes |= lane;
            }
            lanes &= ~lane;
          }
        }
        function getHighestPriorityPendingLanes(root2) {
          return getHighestPriorityLanes(root2.pendingLanes);
        }
        function getLanesToRetrySynchronouslyOnError(root2) {
          var everythingButOffscreen = root2.pendingLanes & ~OffscreenLane;
          if (everythingButOffscreen !== NoLanes) {
            return everythingButOffscreen;
          }
          if (everythingButOffscreen & OffscreenLane) {
            return OffscreenLane;
          }
          return NoLanes;
        }
        function includesSyncLane(lanes) {
          return (lanes & SyncLane) !== NoLanes;
        }
        function includesNonIdleWork(lanes) {
          return (lanes & NonIdleLanes) !== NoLanes;
        }
        function includesOnlyRetries(lanes) {
          return (lanes & RetryLanes) === lanes;
        }
        function includesOnlyNonUrgentLanes(lanes) {
          var UrgentLanes = SyncLane | InputContinuousLane | DefaultLane;
          return (lanes & UrgentLanes) === NoLanes;
        }
        function includesOnlyTransitions(lanes) {
          return (lanes & TransitionLanes) === lanes;
        }
        function includesBlockingLane(root2, lanes) {
          var SyncDefaultLanes = InputContinuousHydrationLane | InputContinuousLane | DefaultHydrationLane | DefaultLane;
          return (lanes & SyncDefaultLanes) !== NoLanes;
        }
        function includesExpiredLane(root2, lanes) {
          return (lanes & root2.expiredLanes) !== NoLanes;
        }
        function isTransitionLane(lane) {
          return (lane & TransitionLanes) !== NoLanes;
        }
        function claimNextTransitionLane() {
          var lane = nextTransitionLane;
          nextTransitionLane <<= 1;
          if ((nextTransitionLane & TransitionLanes) === NoLanes) {
            nextTransitionLane = TransitionLane1;
          }
          return lane;
        }
        function claimNextRetryLane() {
          var lane = nextRetryLane;
          nextRetryLane <<= 1;
          if ((nextRetryLane & RetryLanes) === NoLanes) {
            nextRetryLane = RetryLane1;
          }
          return lane;
        }
        function getHighestPriorityLane(lanes) {
          return lanes & -lanes;
        }
        function pickArbitraryLane(lanes) {
          return getHighestPriorityLane(lanes);
        }
        function pickArbitraryLaneIndex(lanes) {
          return 31 - clz32(lanes);
        }
        function laneToIndex(lane) {
          return pickArbitraryLaneIndex(lane);
        }
        function includesSomeLane(a, b) {
          return (a & b) !== NoLanes;
        }
        function isSubsetOfLanes(set2, subset) {
          return (set2 & subset) === subset;
        }
        function mergeLanes(a, b) {
          return a | b;
        }
        function removeLanes(set2, subset) {
          return set2 & ~subset;
        }
        function intersectLanes(a, b) {
          return a & b;
        }
        function laneToLanes(lane) {
          return lane;
        }
        function higherPriorityLane(a, b) {
          return a !== NoLane && a < b ? a : b;
        }
        function createLaneMap(initial) {
          var laneMap = [];
          for (var i = 0; i < TotalLanes; i++) {
            laneMap.push(initial);
          }
          return laneMap;
        }
        function markRootUpdated(root2, updateLane, eventTime) {
          root2.pendingLanes |= updateLane;
          if (updateLane !== IdleLane) {
            root2.suspendedLanes = NoLanes;
            root2.pingedLanes = NoLanes;
          }
          var eventTimes = root2.eventTimes;
          var index2 = laneToIndex(updateLane);
          eventTimes[index2] = eventTime;
        }
        function markRootSuspended(root2, suspendedLanes) {
          root2.suspendedLanes |= suspendedLanes;
          root2.pingedLanes &= ~suspendedLanes;
          var expirationTimes = root2.expirationTimes;
          var lanes = suspendedLanes;
          while (lanes > 0) {
            var index2 = pickArbitraryLaneIndex(lanes);
            var lane = 1 << index2;
            expirationTimes[index2] = NoTimestamp;
            lanes &= ~lane;
          }
        }
        function markRootPinged(root2, pingedLanes, eventTime) {
          root2.pingedLanes |= root2.suspendedLanes & pingedLanes;
        }
        function markRootFinished(root2, remainingLanes) {
          var noLongerPendingLanes = root2.pendingLanes & ~remainingLanes;
          root2.pendingLanes = remainingLanes;
          root2.suspendedLanes = NoLanes;
          root2.pingedLanes = NoLanes;
          root2.expiredLanes &= remainingLanes;
          root2.mutableReadLanes &= remainingLanes;
          root2.entangledLanes &= remainingLanes;
          var entanglements = root2.entanglements;
          var eventTimes = root2.eventTimes;
          var expirationTimes = root2.expirationTimes;
          var lanes = noLongerPendingLanes;
          while (lanes > 0) {
            var index2 = pickArbitraryLaneIndex(lanes);
            var lane = 1 << index2;
            entanglements[index2] = NoLanes;
            eventTimes[index2] = NoTimestamp;
            expirationTimes[index2] = NoTimestamp;
            lanes &= ~lane;
          }
        }
        function markRootEntangled(root2, entangledLanes) {
          var rootEntangledLanes = root2.entangledLanes |= entangledLanes;
          var entanglements = root2.entanglements;
          var lanes = rootEntangledLanes;
          while (lanes) {
            var index2 = pickArbitraryLaneIndex(lanes);
            var lane = 1 << index2;
            if (
              // Is this one of the newly entangled lanes?
              lane & entangledLanes | // Is this lane transitively entangled with the newly entangled lanes?
              entanglements[index2] & entangledLanes
            ) {
              entanglements[index2] |= entangledLanes;
            }
            lanes &= ~lane;
          }
        }
        function getBumpedLaneForHydration(root2, renderLanes2) {
          var renderLane = getHighestPriorityLane(renderLanes2);
          var lane;
          switch (renderLane) {
            case InputContinuousLane:
              lane = InputContinuousHydrationLane;
              break;
            case DefaultLane:
              lane = DefaultHydrationLane;
              break;
            case TransitionLane1:
            case TransitionLane2:
            case TransitionLane3:
            case TransitionLane4:
            case TransitionLane5:
            case TransitionLane6:
            case TransitionLane7:
            case TransitionLane8:
            case TransitionLane9:
            case TransitionLane10:
            case TransitionLane11:
            case TransitionLane12:
            case TransitionLane13:
            case TransitionLane14:
            case TransitionLane15:
            case TransitionLane16:
            case RetryLane1:
            case RetryLane2:
            case RetryLane3:
            case RetryLane4:
            case RetryLane5:
              lane = TransitionHydrationLane;
              break;
            case IdleLane:
              lane = IdleHydrationLane;
              break;
            default:
              lane = NoLane;
              break;
          }
          if ((lane & (root2.suspendedLanes | renderLanes2)) !== NoLane) {
            return NoLane;
          }
          return lane;
        }
        function addFiberToLanesMap(root2, fiber, lanes) {
          if (!isDevToolsPresent) {
            return;
          }
          var pendingUpdatersLaneMap = root2.pendingUpdatersLaneMap;
          while (lanes > 0) {
            var index2 = laneToIndex(lanes);
            var lane = 1 << index2;
            var updaters = pendingUpdatersLaneMap[index2];
            updaters.add(fiber);
            lanes &= ~lane;
          }
        }
        function movePendingFibersToMemoized(root2, lanes) {
          if (!isDevToolsPresent) {
            return;
          }
          var pendingUpdatersLaneMap = root2.pendingUpdatersLaneMap;
          var memoizedUpdaters = root2.memoizedUpdaters;
          while (lanes > 0) {
            var index2 = laneToIndex(lanes);
            var lane = 1 << index2;
            var updaters = pendingUpdatersLaneMap[index2];
            if (updaters.size > 0) {
              updaters.forEach(function(fiber) {
                var alternate = fiber.alternate;
                if (alternate === null || !memoizedUpdaters.has(alternate)) {
                  memoizedUpdaters.add(fiber);
                }
              });
              updaters.clear();
            }
            lanes &= ~lane;
          }
        }
        function getTransitionsForLanes(root2, lanes) {
          {
            return null;
          }
        }
        var DiscreteEventPriority = SyncLane;
        var ContinuousEventPriority = InputContinuousLane;
        var DefaultEventPriority = DefaultLane;
        var IdleEventPriority = IdleLane;
        var currentUpdatePriority = NoLane;
        function getCurrentUpdatePriority() {
          return currentUpdatePriority;
        }
        function setCurrentUpdatePriority(newPriority) {
          currentUpdatePriority = newPriority;
        }
        function runWithPriority(priority, fn) {
          var previousPriority = currentUpdatePriority;
          try {
            currentUpdatePriority = priority;
            return fn();
          } finally {
            currentUpdatePriority = previousPriority;
          }
        }
        function higherEventPriority(a, b) {
          return a !== 0 && a < b ? a : b;
        }
        function lowerEventPriority(a, b) {
          return a === 0 || a > b ? a : b;
        }
        function isHigherEventPriority(a, b) {
          return a !== 0 && a < b;
        }
        function lanesToEventPriority(lanes) {
          var lane = getHighestPriorityLane(lanes);
          if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
            return DiscreteEventPriority;
          }
          if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
            return ContinuousEventPriority;
          }
          if (includesNonIdleWork(lane)) {
            return DefaultEventPriority;
          }
          return IdleEventPriority;
        }
        function isRootDehydrated(root2) {
          var currentState = root2.current.memoizedState;
          return currentState.isDehydrated;
        }
        var _attemptSynchronousHydration;
        function setAttemptSynchronousHydration(fn) {
          _attemptSynchronousHydration = fn;
        }
        function attemptSynchronousHydration(fiber) {
          _attemptSynchronousHydration(fiber);
        }
        var attemptContinuousHydration;
        function setAttemptContinuousHydration(fn) {
          attemptContinuousHydration = fn;
        }
        var attemptHydrationAtCurrentPriority;
        function setAttemptHydrationAtCurrentPriority(fn) {
          attemptHydrationAtCurrentPriority = fn;
        }
        var getCurrentUpdatePriority$1;
        function setGetCurrentUpdatePriority(fn) {
          getCurrentUpdatePriority$1 = fn;
        }
        var attemptHydrationAtPriority;
        function setAttemptHydrationAtPriority(fn) {
          attemptHydrationAtPriority = fn;
        }
        var hasScheduledReplayAttempt = false;
        var queuedDiscreteEvents = [];
        var queuedFocus = null;
        var queuedDrag = null;
        var queuedMouse = null;
        var queuedPointers = /* @__PURE__ */ new Map();
        var queuedPointerCaptures = /* @__PURE__ */ new Map();
        var queuedExplicitHydrationTargets = [];
        var discreteReplayableEvents = [
          "mousedown",
          "mouseup",
          "touchcancel",
          "touchend",
          "touchstart",
          "auxclick",
          "dblclick",
          "pointercancel",
          "pointerdown",
          "pointerup",
          "dragend",
          "dragstart",
          "drop",
          "compositionend",
          "compositionstart",
          "keydown",
          "keypress",
          "keyup",
          "input",
          "textInput",
          // Intentionally camelCase
          "copy",
          "cut",
          "paste",
          "click",
          "change",
          "contextmenu",
          "reset",
          "submit"
        ];
        function isDiscreteEventThatRequiresHydration(eventType) {
          return discreteReplayableEvents.indexOf(eventType) > -1;
        }
        function createQueuedReplayableEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
          return {
            blockedOn,
            domEventName,
            eventSystemFlags,
            nativeEvent,
            targetContainers: [targetContainer]
          };
        }
        function clearIfContinuousEvent(domEventName, nativeEvent) {
          switch (domEventName) {
            case "focusin":
            case "focusout":
              queuedFocus = null;
              break;
            case "dragenter":
            case "dragleave":
              queuedDrag = null;
              break;
            case "mouseover":
            case "mouseout":
              queuedMouse = null;
              break;
            case "pointerover":
            case "pointerout": {
              var pointerId = nativeEvent.pointerId;
              queuedPointers.delete(pointerId);
              break;
            }
            case "gotpointercapture":
            case "lostpointercapture": {
              var _pointerId = nativeEvent.pointerId;
              queuedPointerCaptures.delete(_pointerId);
              break;
            }
          }
        }
        function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
          if (existingQueuedEvent === null || existingQueuedEvent.nativeEvent !== nativeEvent) {
            var queuedEvent = createQueuedReplayableEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent);
            if (blockedOn !== null) {
              var _fiber2 = getInstanceFromNode(blockedOn);
              if (_fiber2 !== null) {
                attemptContinuousHydration(_fiber2);
              }
            }
            return queuedEvent;
          }
          existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
          var targetContainers = existingQueuedEvent.targetContainers;
          if (targetContainer !== null && targetContainers.indexOf(targetContainer) === -1) {
            targetContainers.push(targetContainer);
          }
          return existingQueuedEvent;
        }
        function queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
          switch (domEventName) {
            case "focusin": {
              var focusEvent = nativeEvent;
              queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(queuedFocus, blockedOn, domEventName, eventSystemFlags, targetContainer, focusEvent);
              return true;
            }
            case "dragenter": {
              var dragEvent = nativeEvent;
              queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(queuedDrag, blockedOn, domEventName, eventSystemFlags, targetContainer, dragEvent);
              return true;
            }
            case "mouseover": {
              var mouseEvent = nativeEvent;
              queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(queuedMouse, blockedOn, domEventName, eventSystemFlags, targetContainer, mouseEvent);
              return true;
            }
            case "pointerover": {
              var pointerEvent = nativeEvent;
              var pointerId = pointerEvent.pointerId;
              queuedPointers.set(pointerId, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointers.get(pointerId) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, pointerEvent));
              return true;
            }
            case "gotpointercapture": {
              var _pointerEvent = nativeEvent;
              var _pointerId2 = _pointerEvent.pointerId;
              queuedPointerCaptures.set(_pointerId2, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointerCaptures.get(_pointerId2) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, _pointerEvent));
              return true;
            }
          }
          return false;
        }
        function attemptExplicitHydrationTarget(queuedTarget) {
          var targetInst = getClosestInstanceFromNode(queuedTarget.target);
          if (targetInst !== null) {
            var nearestMounted = getNearestMountedFiber(targetInst);
            if (nearestMounted !== null) {
              var tag = nearestMounted.tag;
              if (tag === SuspenseComponent) {
                var instance = getSuspenseInstanceFromFiber(nearestMounted);
                if (instance !== null) {
                  queuedTarget.blockedOn = instance;
                  attemptHydrationAtPriority(queuedTarget.priority, function() {
                    attemptHydrationAtCurrentPriority(nearestMounted);
                  });
                  return;
                }
              } else if (tag === HostRoot) {
                var root2 = nearestMounted.stateNode;
                if (isRootDehydrated(root2)) {
                  queuedTarget.blockedOn = getContainerFromFiber(nearestMounted);
                  return;
                }
              }
            }
          }
          queuedTarget.blockedOn = null;
        }
        function queueExplicitHydrationTarget(target) {
          var updatePriority = getCurrentUpdatePriority$1();
          var queuedTarget = {
            blockedOn: null,
            target,
            priority: updatePriority
          };
          var i = 0;
          for (; i < queuedExplicitHydrationTargets.length; i++) {
            if (!isHigherEventPriority(updatePriority, queuedExplicitHydrationTargets[i].priority)) {
              break;
            }
          }
          queuedExplicitHydrationTargets.splice(i, 0, queuedTarget);
          if (i === 0) {
            attemptExplicitHydrationTarget(queuedTarget);
          }
        }
        function attemptReplayContinuousQueuedEvent(queuedEvent) {
          if (queuedEvent.blockedOn !== null) {
            return false;
          }
          var targetContainers = queuedEvent.targetContainers;
          while (targetContainers.length > 0) {
            var targetContainer = targetContainers[0];
            var nextBlockedOn = findInstanceBlockingEvent(queuedEvent.domEventName, queuedEvent.eventSystemFlags, targetContainer, queuedEvent.nativeEvent);
            if (nextBlockedOn === null) {
              {
                var nativeEvent = queuedEvent.nativeEvent;
                var nativeEventClone = new nativeEvent.constructor(nativeEvent.type, nativeEvent);
                setReplayingEvent(nativeEventClone);
                nativeEvent.target.dispatchEvent(nativeEventClone);
                resetReplayingEvent();
              }
            } else {
              var _fiber3 = getInstanceFromNode(nextBlockedOn);
              if (_fiber3 !== null) {
                attemptContinuousHydration(_fiber3);
              }
              queuedEvent.blockedOn = nextBlockedOn;
              return false;
            }
            targetContainers.shift();
          }
          return true;
        }
        function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
          if (attemptReplayContinuousQueuedEvent(queuedEvent)) {
            map.delete(key);
          }
        }
        function replayUnblockedEvents() {
          hasScheduledReplayAttempt = false;
          if (queuedFocus !== null && attemptReplayContinuousQueuedEvent(queuedFocus)) {
            queuedFocus = null;
          }
          if (queuedDrag !== null && attemptReplayContinuousQueuedEvent(queuedDrag)) {
            queuedDrag = null;
          }
          if (queuedMouse !== null && attemptReplayContinuousQueuedEvent(queuedMouse)) {
            queuedMouse = null;
          }
          queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
          queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
        }
        function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
          if (queuedEvent.blockedOn === unblocked) {
            queuedEvent.blockedOn = null;
            if (!hasScheduledReplayAttempt) {
              hasScheduledReplayAttempt = true;
              Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, replayUnblockedEvents);
            }
          }
        }
        function retryIfBlockedOn(unblocked) {
          if (queuedDiscreteEvents.length > 0) {
            scheduleCallbackIfUnblocked(queuedDiscreteEvents[0], unblocked);
            for (var i = 1; i < queuedDiscreteEvents.length; i++) {
              var queuedEvent = queuedDiscreteEvents[i];
              if (queuedEvent.blockedOn === unblocked) {
                queuedEvent.blockedOn = null;
              }
            }
          }
          if (queuedFocus !== null) {
            scheduleCallbackIfUnblocked(queuedFocus, unblocked);
          }
          if (queuedDrag !== null) {
            scheduleCallbackIfUnblocked(queuedDrag, unblocked);
          }
          if (queuedMouse !== null) {
            scheduleCallbackIfUnblocked(queuedMouse, unblocked);
          }
          var unblock = function(queuedEvent2) {
            return scheduleCallbackIfUnblocked(queuedEvent2, unblocked);
          };
          queuedPointers.forEach(unblock);
          queuedPointerCaptures.forEach(unblock);
          for (var _i = 0; _i < queuedExplicitHydrationTargets.length; _i++) {
            var queuedTarget = queuedExplicitHydrationTargets[_i];
            if (queuedTarget.blockedOn === unblocked) {
              queuedTarget.blockedOn = null;
            }
          }
          while (queuedExplicitHydrationTargets.length > 0) {
            var nextExplicitTarget = queuedExplicitHydrationTargets[0];
            if (nextExplicitTarget.blockedOn !== null) {
              break;
            } else {
              attemptExplicitHydrationTarget(nextExplicitTarget);
              if (nextExplicitTarget.blockedOn === null) {
                queuedExplicitHydrationTargets.shift();
              }
            }
          }
        }
        var ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig;
        var _enabled = true;
        function setEnabled(enabled) {
          _enabled = !!enabled;
        }
        function isEnabled() {
          return _enabled;
        }
        function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
          var eventPriority = getEventPriority(domEventName);
          var listenerWrapper;
          switch (eventPriority) {
            case DiscreteEventPriority:
              listenerWrapper = dispatchDiscreteEvent;
              break;
            case ContinuousEventPriority:
              listenerWrapper = dispatchContinuousEvent;
              break;
            case DefaultEventPriority:
            default:
              listenerWrapper = dispatchEvent;
              break;
          }
          return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
        }
        function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
          var previousPriority = getCurrentUpdatePriority();
          var prevTransition = ReactCurrentBatchConfig.transition;
          ReactCurrentBatchConfig.transition = null;
          try {
            setCurrentUpdatePriority(DiscreteEventPriority);
            dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
          } finally {
            setCurrentUpdatePriority(previousPriority);
            ReactCurrentBatchConfig.transition = prevTransition;
          }
        }
        function dispatchContinuousEvent(domEventName, eventSystemFlags, container, nativeEvent) {
          var previousPriority = getCurrentUpdatePriority();
          var prevTransition = ReactCurrentBatchConfig.transition;
          ReactCurrentBatchConfig.transition = null;
          try {
            setCurrentUpdatePriority(ContinuousEventPriority);
            dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
          } finally {
            setCurrentUpdatePriority(previousPriority);
            ReactCurrentBatchConfig.transition = prevTransition;
          }
        }
        function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
          if (!_enabled) {
            return;
          }
          {
            dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay(domEventName, eventSystemFlags, targetContainer, nativeEvent);
          }
        }
        function dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
          var blockedOn = findInstanceBlockingEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent);
          if (blockedOn === null) {
            dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, return_targetInst, targetContainer);
            clearIfContinuousEvent(domEventName, nativeEvent);
            return;
          }
          if (queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent)) {
            nativeEvent.stopPropagation();
            return;
          }
          clearIfContinuousEvent(domEventName, nativeEvent);
          if (eventSystemFlags & IS_CAPTURE_PHASE && isDiscreteEventThatRequiresHydration(domEventName)) {
            while (blockedOn !== null) {
              var fiber = getInstanceFromNode(blockedOn);
              if (fiber !== null) {
                attemptSynchronousHydration(fiber);
              }
              var nextBlockedOn = findInstanceBlockingEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent);
              if (nextBlockedOn === null) {
                dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, return_targetInst, targetContainer);
              }
              if (nextBlockedOn === blockedOn) {
                break;
              }
              blockedOn = nextBlockedOn;
            }
            if (blockedOn !== null) {
              nativeEvent.stopPropagation();
            }
            return;
          }
          dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, null, targetContainer);
        }
        var return_targetInst = null;
        function findInstanceBlockingEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
          return_targetInst = null;
          var nativeEventTarget = getEventTarget(nativeEvent);
          var targetInst = getClosestInstanceFromNode(nativeEventTarget);
          if (targetInst !== null) {
            var nearestMounted = getNearestMountedFiber(targetInst);
            if (nearestMounted === null) {
              targetInst = null;
            } else {
              var tag = nearestMounted.tag;
              if (tag === SuspenseComponent) {
                var instance = getSuspenseInstanceFromFiber(nearestMounted);
                if (instance !== null) {
                  return instance;
                }
                targetInst = null;
              } else if (tag === HostRoot) {
                var root2 = nearestMounted.stateNode;
                if (isRootDehydrated(root2)) {
                  return getContainerFromFiber(nearestMounted);
                }
                targetInst = null;
              } else if (nearestMounted !== targetInst) {
                targetInst = null;
              }
            }
          }
          return_targetInst = targetInst;
          return null;
        }
        function getEventPriority(domEventName) {
          switch (domEventName) {
            case "cancel":
            case "click":
            case "close":
            case "contextmenu":
            case "copy":
            case "cut":
            case "auxclick":
            case "dblclick":
            case "dragend":
            case "dragstart":
            case "drop":
            case "focusin":
            case "focusout":
            case "input":
            case "invalid":
            case "keydown":
            case "keypress":
            case "keyup":
            case "mousedown":
            case "mouseup":
            case "paste":
            case "pause":
            case "play":
            case "pointercancel":
            case "pointerdown":
            case "pointerup":
            case "ratechange":
            case "reset":
            case "resize":
            case "seeked":
            case "submit":
            case "touchcancel":
            case "touchend":
            case "touchstart":
            case "volumechange":
            case "change":
            case "selectionchange":
            case "textInput":
            case "compositionstart":
            case "compositionend":
            case "compositionupdate":
            case "beforeblur":
            case "afterblur":
            case "beforeinput":
            case "blur":
            case "fullscreenchange":
            case "focus":
            case "hashchange":
            case "popstate":
            case "select":
            case "selectstart":
              return DiscreteEventPriority;
            case "drag":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "mousemove":
            case "mouseout":
            case "mouseover":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "scroll":
            case "toggle":
            case "touchmove":
            case "wheel":
            case "mouseenter":
            case "mouseleave":
            case "pointerenter":
            case "pointerleave":
              return ContinuousEventPriority;
            case "message": {
              var schedulerPriority = getCurrentPriorityLevel();
              switch (schedulerPriority) {
                case ImmediatePriority:
                  return DiscreteEventPriority;
                case UserBlockingPriority:
                  return ContinuousEventPriority;
                case NormalPriority:
                case LowPriority:
                  return DefaultEventPriority;
                case IdlePriority:
                  return IdleEventPriority;
                default:
                  return DefaultEventPriority;
              }
            }
            default:
              return DefaultEventPriority;
          }
        }
        function addEventBubbleListener(target, eventType, listener) {
          target.addEventListener(eventType, listener, false);
          return listener;
        }
        function addEventCaptureListener(target, eventType, listener) {
          target.addEventListener(eventType, listener, true);
          return listener;
        }
        function addEventCaptureListenerWithPassiveFlag(target, eventType, listener, passive) {
          target.addEventListener(eventType, listener, {
            capture: true,
            passive
          });
          return listener;
        }
        function addEventBubbleListenerWithPassiveFlag(target, eventType, listener, passive) {
          target.addEventListener(eventType, listener, {
            passive
          });
          return listener;
        }
        var root = null;
        var startText = null;
        var fallbackText = null;
        function initialize(nativeEventTarget) {
          root = nativeEventTarget;
          startText = getText();
          return true;
        }
        function reset() {
          root = null;
          startText = null;
          fallbackText = null;
        }
        function getData() {
          if (fallbackText) {
            return fallbackText;
          }
          var start;
          var startValue = startText;
          var startLength = startValue.length;
          var end;
          var endValue = getText();
          var endLength = endValue.length;
          for (start = 0; start < startLength; start++) {
            if (startValue[start] !== endValue[start]) {
              break;
            }
          }
          var minEnd = startLength - start;
          for (end = 1; end <= minEnd; end++) {
            if (startValue[startLength - end] !== endValue[endLength - end]) {
              break;
            }
          }
          var sliceTail = end > 1 ? 1 - end : void 0;
          fallbackText = endValue.slice(start, sliceTail);
          return fallbackText;
        }
        function getText() {
          if ("value" in root) {
            return root.value;
          }
          return root.textContent;
        }
        function getEventCharCode(nativeEvent) {
          var charCode;
          var keyCode = nativeEvent.keyCode;
          if ("charCode" in nativeEvent) {
            charCode = nativeEvent.charCode;
            if (charCode === 0 && keyCode === 13) {
              charCode = 13;
            }
          } else {
            charCode = keyCode;
          }
          if (charCode === 10) {
            charCode = 13;
          }
          if (charCode >= 32 || charCode === 13) {
            return charCode;
          }
          return 0;
        }
        function functionThatReturnsTrue() {
          return true;
        }
        function functionThatReturnsFalse() {
          return false;
        }
        function createSyntheticEvent(Interface) {
          function SyntheticBaseEvent(reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
            this._reactName = reactName;
            this._targetInst = targetInst;
            this.type = reactEventType;
            this.nativeEvent = nativeEvent;
            this.target = nativeEventTarget;
            this.currentTarget = null;
            for (var _propName in Interface) {
              if (!Interface.hasOwnProperty(_propName)) {
                continue;
              }
              var normalize = Interface[_propName];
              if (normalize) {
                this[_propName] = normalize(nativeEvent);
              } else {
                this[_propName] = nativeEvent[_propName];
              }
            }
            var defaultPrevented = nativeEvent.defaultPrevented != null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === false;
            if (defaultPrevented) {
              this.isDefaultPrevented = functionThatReturnsTrue;
            } else {
              this.isDefaultPrevented = functionThatReturnsFalse;
            }
            this.isPropagationStopped = functionThatReturnsFalse;
            return this;
          }
          assign(SyntheticBaseEvent.prototype, {
            preventDefault: function() {
              this.defaultPrevented = true;
              var event = this.nativeEvent;
              if (!event) {
                return;
              }
              if (event.preventDefault) {
                event.preventDefault();
              } else if (typeof event.returnValue !== "unknown") {
                event.returnValue = false;
              }
              this.isDefaultPrevented = functionThatReturnsTrue;
            },
            stopPropagation: function() {
              var event = this.nativeEvent;
              if (!event) {
                return;
              }
              if (event.stopPropagation) {
                event.stopPropagation();
              } else if (typeof event.cancelBubble !== "unknown") {
                event.cancelBubble = true;
              }
              this.isPropagationStopped = functionThatReturnsTrue;
            },
            /**
             * We release all dispatched `SyntheticEvent`s after each event loop, adding
             * them back into the pool. This allows a way to hold onto a reference that
             * won't be added back into the pool.
             */
            persist: function() {
            },
            /**
             * Checks if this event should be released back into the pool.
             *
             * @return {boolean} True if this should not be released, false otherwise.
             */
            isPersistent: functionThatReturnsTrue
          });
          return SyntheticBaseEvent;
        }
        var EventInterface = {
          eventPhase: 0,
          bubbles: 0,
          cancelable: 0,
          timeStamp: function(event) {
            return event.timeStamp || Date.now();
          },
          defaultPrevented: 0,
          isTrusted: 0
        };
        var SyntheticEvent = createSyntheticEvent(EventInterface);
        var UIEventInterface = assign({}, EventInterface, {
          view: 0,
          detail: 0
        });
        var SyntheticUIEvent = createSyntheticEvent(UIEventInterface);
        var lastMovementX;
        var lastMovementY;
        var lastMouseEvent;
        function updateMouseMovementPolyfillState(event) {
          if (event !== lastMouseEvent) {
            if (lastMouseEvent && event.type === "mousemove") {
              lastMovementX = event.screenX - lastMouseEvent.screenX;
              lastMovementY = event.screenY - lastMouseEvent.screenY;
            } else {
              lastMovementX = 0;
              lastMovementY = 0;
            }
            lastMouseEvent = event;
          }
        }
        var MouseEventInterface = assign({}, UIEventInterface, {
          screenX: 0,
          screenY: 0,
          clientX: 0,
          clientY: 0,
          pageX: 0,
          pageY: 0,
          ctrlKey: 0,
          shiftKey: 0,
          altKey: 0,
          metaKey: 0,
          getModifierState: getEventModifierState,
          button: 0,
          buttons: 0,
          relatedTarget: function(event) {
            if (event.relatedTarget === void 0) return event.fromElement === event.srcElement ? event.toElement : event.fromElement;
            return event.relatedTarget;
          },
          movementX: function(event) {
            if ("movementX" in event) {
              return event.movementX;
            }
            updateMouseMovementPolyfillState(event);
            return lastMovementX;
          },
          movementY: function(event) {
            if ("movementY" in event) {
              return event.movementY;
            }
            return lastMovementY;
          }
        });
        var SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);
        var DragEventInterface = assign({}, MouseEventInterface, {
          dataTransfer: 0
        });
        var SyntheticDragEvent = createSyntheticEvent(DragEventInterface);
        var FocusEventInterface = assign({}, UIEventInterface, {
          relatedTarget: 0
        });
        var SyntheticFocusEvent = createSyntheticEvent(FocusEventInterface);
        var AnimationEventInterface = assign({}, EventInterface, {
          animationName: 0,
          elapsedTime: 0,
          pseudoElement: 0
        });
        var SyntheticAnimationEvent = createSyntheticEvent(AnimationEventInterface);
        var ClipboardEventInterface = assign({}, EventInterface, {
          clipboardData: function(event) {
            return "clipboardData" in event ? event.clipboardData : window.clipboardData;
          }
        });
        var SyntheticClipboardEvent = createSyntheticEvent(ClipboardEventInterface);
        var CompositionEventInterface = assign({}, EventInterface, {
          data: 0
        });
        var SyntheticCompositionEvent = createSyntheticEvent(CompositionEventInterface);
        var SyntheticInputEvent = SyntheticCompositionEvent;
        var normalizeKey = {
          Esc: "Escape",
          Spacebar: " ",
          Left: "ArrowLeft",
          Up: "ArrowUp",
          Right: "ArrowRight",
          Down: "ArrowDown",
          Del: "Delete",
          Win: "OS",
          Menu: "ContextMenu",
          Apps: "ContextMenu",
          Scroll: "ScrollLock",
          MozPrintableKey: "Unidentified"
        };
        var translateToKey = {
          "8": "Backspace",
          "9": "Tab",
          "12": "Clear",
          "13": "Enter",
          "16": "Shift",
          "17": "Control",
          "18": "Alt",
          "19": "Pause",
          "20": "CapsLock",
          "27": "Escape",
          "32": " ",
          "33": "PageUp",
          "34": "PageDown",
          "35": "End",
          "36": "Home",
          "37": "ArrowLeft",
          "38": "ArrowUp",
          "39": "ArrowRight",
          "40": "ArrowDown",
          "45": "Insert",
          "46": "Delete",
          "112": "F1",
          "113": "F2",
          "114": "F3",
          "115": "F4",
          "116": "F5",
          "117": "F6",
          "118": "F7",
          "119": "F8",
          "120": "F9",
          "121": "F10",
          "122": "F11",
          "123": "F12",
          "144": "NumLock",
          "145": "ScrollLock",
          "224": "Meta"
        };
        function getEventKey(nativeEvent) {
          if (nativeEvent.key) {
            var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
            if (key !== "Unidentified") {
              return key;
            }
          }
          if (nativeEvent.type === "keypress") {
            var charCode = getEventCharCode(nativeEvent);
            return charCode === 13 ? "Enter" : String.fromCharCode(charCode);
          }
          if (nativeEvent.type === "keydown" || nativeEvent.type === "keyup") {
            return translateToKey[nativeEvent.keyCode] || "Unidentified";
          }
          return "";
        }
        var modifierKeyToProp = {
          Alt: "altKey",
          Control: "ctrlKey",
          Meta: "metaKey",
          Shift: "shiftKey"
        };
        function modifierStateGetter(keyArg) {
          var syntheticEvent = this;
          var nativeEvent = syntheticEvent.nativeEvent;
          if (nativeEvent.getModifierState) {
            return nativeEvent.getModifierState(keyArg);
          }
          var keyProp = modifierKeyToProp[keyArg];
          return keyProp ? !!nativeEvent[keyProp] : false;
        }
        function getEventModifierState(nativeEvent) {
          return modifierStateGetter;
        }
        var KeyboardEventInterface = assign({}, UIEventInterface, {
          key: getEventKey,
          code: 0,
          location: 0,
          ctrlKey: 0,
          shiftKey: 0,
          altKey: 0,
          metaKey: 0,
          repeat: 0,
          locale: 0,
          getModifierState: getEventModifierState,
          // Legacy Interface
          charCode: function(event) {
            if (event.type === "keypress") {
              return getEventCharCode(event);
            }
            return 0;
          },
          keyCode: function(event) {
            if (event.type === "keydown" || event.type === "keyup") {
              return event.keyCode;
            }
            return 0;
          },
          which: function(event) {
            if (event.type === "keypress") {
              return getEventCharCode(event);
            }
            if (event.type === "keydown" || event.type === "keyup") {
              return event.keyCode;
            }
            return 0;
          }
        });
        var SyntheticKeyboardEvent = createSyntheticEvent(KeyboardEventInterface);
        var PointerEventInterface = assign({}, MouseEventInterface, {
          pointerId: 0,
          width: 0,
          height: 0,
          pressure: 0,
          tangentialPressure: 0,
          tiltX: 0,
          tiltY: 0,
          twist: 0,
          pointerType: 0,
          isPrimary: 0
        });
        var SyntheticPointerEvent = createSyntheticEvent(PointerEventInterface);
        var TouchEventInterface = assign({}, UIEventInterface, {
          touches: 0,
          targetTouches: 0,
          changedTouches: 0,
          altKey: 0,
          metaKey: 0,
          ctrlKey: 0,
          shiftKey: 0,
          getModifierState: getEventModifierState
        });
        var SyntheticTouchEvent = createSyntheticEvent(TouchEventInterface);
        var TransitionEventInterface = assign({}, EventInterface, {
          propertyName: 0,
          elapsedTime: 0,
          pseudoElement: 0
        });
        var SyntheticTransitionEvent = createSyntheticEvent(TransitionEventInterface);
        var WheelEventInterface = assign({}, MouseEventInterface, {
          deltaX: function(event) {
            return "deltaX" in event ? event.deltaX : (
              // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
              "wheelDeltaX" in event ? -event.wheelDeltaX : 0
            );
          },
          deltaY: function(event) {
            return "deltaY" in event ? event.deltaY : (
              // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
              "wheelDeltaY" in event ? -event.wheelDeltaY : (
                // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
                "wheelDelta" in event ? -event.wheelDelta : 0
              )
            );
          },
          deltaZ: 0,
          // Browsers without "deltaMode" is reporting in raw wheel delta where one
          // notch on the scroll is always +/- 120, roughly equivalent to pixels.
          // A good approximation of DOM_DELTA_LINE (1) is 5% of viewport size or
          // ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5% of viewport size.
          deltaMode: 0
        });
        var SyntheticWheelEvent = createSyntheticEvent(WheelEventInterface);
        var END_KEYCODES = [9, 13, 27, 32];
        var START_KEYCODE = 229;
        var canUseCompositionEvent = canUseDOM && "CompositionEvent" in window;
        var documentMode = null;
        if (canUseDOM && "documentMode" in document) {
          documentMode = document.documentMode;
        }
        var canUseTextInputEvent = canUseDOM && "TextEvent" in window && !documentMode;
        var useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || documentMode && documentMode > 8 && documentMode <= 11);
        var SPACEBAR_CODE = 32;
        var SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);
        function registerEvents() {
          registerTwoPhaseEvent("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
          registerTwoPhaseEvent("onCompositionEnd", ["compositionend", "focusout", "keydown", "keypress", "keyup", "mousedown"]);
          registerTwoPhaseEvent("onCompositionStart", ["compositionstart", "focusout", "keydown", "keypress", "keyup", "mousedown"]);
          registerTwoPhaseEvent("onCompositionUpdate", ["compositionupdate", "focusout", "keydown", "keypress", "keyup", "mousedown"]);
        }
        var hasSpaceKeypress = false;
        function isKeypressCommand(nativeEvent) {
          return (nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) && // ctrlKey && altKey is equivalent to AltGr, and is not a command.
          !(nativeEvent.ctrlKey && nativeEvent.altKey);
        }
        function getCompositionEventType(domEventName) {
          switch (domEventName) {
            case "compositionstart":
              return "onCompositionStart";
            case "compositionend":
              return "onCompositionEnd";
            case "compositionupdate":
              return "onCompositionUpdate";
          }
        }
        function isFallbackCompositionStart(domEventName, nativeEvent) {
          return domEventName === "keydown" && nativeEvent.keyCode === START_KEYCODE;
        }
        function isFallbackCompositionEnd(domEventName, nativeEvent) {
          switch (domEventName) {
            case "keyup":
              return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;
            case "keydown":
              return nativeEvent.keyCode !== START_KEYCODE;
            case "keypress":
            case "mousedown":
            case "focusout":
              return true;
            default:
              return false;
          }
        }
        function getDataFromCustomEvent(nativeEvent) {
          var detail = nativeEvent.detail;
          if (typeof detail === "object" && "data" in detail) {
            return detail.data;
          }
          return null;
        }
        function isUsingKoreanIME(nativeEvent) {
          return nativeEvent.locale === "ko";
        }
        var isComposing = false;
        function extractCompositionEvent(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget) {
          var eventType;
          var fallbackData;
          if (canUseCompositionEvent) {
            eventType = getCompositionEventType(domEventName);
          } else if (!isComposing) {
            if (isFallbackCompositionStart(domEventName, nativeEvent)) {
              eventType = "onCompositionStart";
            }
          } else if (isFallbackCompositionEnd(domEventName, nativeEvent)) {
            eventType = "onCompositionEnd";
          }
          if (!eventType) {
            return null;
          }
          if (useFallbackCompositionData && !isUsingKoreanIME(nativeEvent)) {
            if (!isComposing && eventType === "onCompositionStart") {
              isComposing = initialize(nativeEventTarget);
            } else if (eventType === "onCompositionEnd") {
              if (isComposing) {
                fallbackData = getData();
              }
            }
          }
          var listeners = accumulateTwoPhaseListeners(targetInst, eventType);
          if (listeners.length > 0) {
            var event = new SyntheticCompositionEvent(eventType, domEventName, null, nativeEvent, nativeEventTarget);
            dispatchQueue.push({
              event,
              listeners
            });
            if (fallbackData) {
              event.data = fallbackData;
            } else {
              var customData = getDataFromCustomEvent(nativeEvent);
              if (customData !== null) {
                event.data = customData;
              }
            }
          }
        }
        function getNativeBeforeInputChars(domEventName, nativeEvent) {
          switch (domEventName) {
            case "compositionend":
              return getDataFromCustomEvent(nativeEvent);
            case "keypress":
              var which = nativeEvent.which;
              if (which !== SPACEBAR_CODE) {
                return null;
              }
              hasSpaceKeypress = true;
              return SPACEBAR_CHAR;
            case "textInput":
              var chars = nativeEvent.data;
              if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
                return null;
              }
              return chars;
            default:
              return null;
          }
        }
        function getFallbackBeforeInputChars(domEventName, nativeEvent) {
          if (isComposing) {
            if (domEventName === "compositionend" || !canUseCompositionEvent && isFallbackCompositionEnd(domEventName, nativeEvent)) {
              var chars = getData();
              reset();
              isComposing = false;
              return chars;
            }
            return null;
          }
          switch (domEventName) {
            case "paste":
              return null;
            case "keypress":
              if (!isKeypressCommand(nativeEvent)) {
                if (nativeEvent.char && nativeEvent.char.length > 1) {
                  return nativeEvent.char;
                } else if (nativeEvent.which) {
                  return String.fromCharCode(nativeEvent.which);
                }
              }
              return null;
            case "compositionend":
              return useFallbackCompositionData && !isUsingKoreanIME(nativeEvent) ? null : nativeEvent.data;
            default:
              return null;
          }
        }
        function extractBeforeInputEvent(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget) {
          var chars;
          if (canUseTextInputEvent) {
            chars = getNativeBeforeInputChars(domEventName, nativeEvent);
          } else {
            chars = getFallbackBeforeInputChars(domEventName, nativeEvent);
          }
          if (!chars) {
            return null;
          }
          var listeners = accumulateTwoPhaseListeners(targetInst, "onBeforeInput");
          if (listeners.length > 0) {
            var event = new SyntheticInputEvent("onBeforeInput", "beforeinput", null, nativeEvent, nativeEventTarget);
            dispatchQueue.push({
              event,
              listeners
            });
            event.data = chars;
          }
        }
        function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
          extractCompositionEvent(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
          extractBeforeInputEvent(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
        }
        var supportedInputTypes = {
          color: true,
          date: true,
          datetime: true,
          "datetime-local": true,
          email: true,
          month: true,
          number: true,
          password: true,
          range: true,
          search: true,
          tel: true,
          text: true,
          time: true,
          url: true,
          week: true
        };
        function isTextInputElement(elem) {
          var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
          if (nodeName === "input") {
            return !!supportedInputTypes[elem.type];
          }
          if (nodeName === "textarea") {
            return true;
          }
          return false;
        }
        function isEventSupported(eventNameSuffix) {
          if (!canUseDOM) {
            return false;
          }
          var eventName = "on" + eventNameSuffix;
          var isSupported = eventName in document;
          if (!isSupported) {
            var element = document.createElement("div");
            element.setAttribute(eventName, "return;");
            isSupported = typeof element[eventName] === "function";
          }
          return isSupported;
        }
        function registerEvents$1() {
          registerTwoPhaseEvent("onChange", ["change", "click", "focusin", "focusout", "input", "keydown", "keyup", "selectionchange"]);
        }
        function createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, target) {
          enqueueStateRestore(target);
          var listeners = accumulateTwoPhaseListeners(inst, "onChange");
          if (listeners.length > 0) {
            var event = new SyntheticEvent("onChange", "change", null, nativeEvent, target);
            dispatchQueue.push({
              event,
              listeners
            });
          }
        }
        var activeElement = null;
        var activeElementInst = null;
        function shouldUseChangeEvent(elem) {
          var nodeName = elem.nodeName && elem.nodeName.toLowerCase();
          return nodeName === "select" || nodeName === "input" && elem.type === "file";
        }
        function manualDispatchChangeEvent(nativeEvent) {
          var dispatchQueue = [];
          createAndAccumulateChangeEvent(dispatchQueue, activeElementInst, nativeEvent, getEventTarget(nativeEvent));
          batchedUpdates(runEventInBatch, dispatchQueue);
        }
        function runEventInBatch(dispatchQueue) {
          processDispatchQueue(dispatchQueue, 0);
        }
        function getInstIfValueChanged(targetInst) {
          var targetNode = getNodeFromInstance(targetInst);
          if (updateValueIfChanged(targetNode)) {
            return targetInst;
          }
        }
        function getTargetInstForChangeEvent(domEventName, targetInst) {
          if (domEventName === "change") {
            return targetInst;
          }
        }
        var isInputEventSupported = false;
        if (canUseDOM) {
          isInputEventSupported = isEventSupported("input") && (!document.documentMode || document.documentMode > 9);
        }
        function startWatchingForValueChange(target, targetInst) {
          activeElement = target;
          activeElementInst = targetInst;
          activeElement.attachEvent("onpropertychange", handlePropertyChange);
        }
        function stopWatchingForValueChange() {
          if (!activeElement) {
            return;
          }
          activeElement.detachEvent("onpropertychange", handlePropertyChange);
          activeElement = null;
          activeElementInst = null;
        }
        function handlePropertyChange(nativeEvent) {
          if (nativeEvent.propertyName !== "value") {
            return;
          }
          if (getInstIfValueChanged(activeElementInst)) {
            manualDispatchChangeEvent(nativeEvent);
          }
        }
        function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
          if (domEventName === "focusin") {
            stopWatchingForValueChange();
            startWatchingForValueChange(target, targetInst);
          } else if (domEventName === "focusout") {
            stopWatchingForValueChange();
          }
        }
        function getTargetInstForInputEventPolyfill(domEventName, targetInst) {
          if (domEventName === "selectionchange" || domEventName === "keyup" || domEventName === "keydown") {
            return getInstIfValueChanged(activeElementInst);
          }
        }
        function shouldUseClickEvent(elem) {
          var nodeName = elem.nodeName;
          return nodeName && nodeName.toLowerCase() === "input" && (elem.type === "checkbox" || elem.type === "radio");
        }
        function getTargetInstForClickEvent(domEventName, targetInst) {
          if (domEventName === "click") {
            return getInstIfValueChanged(targetInst);
          }
        }
        function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
          if (domEventName === "input" || domEventName === "change") {
            return getInstIfValueChanged(targetInst);
          }
        }
        function handleControlledInputBlur(node) {
          var state = node._wrapperState;
          if (!state || !state.controlled || node.type !== "number") {
            return;
          }
          {
            setDefaultValue(node, "number", node.value);
          }
        }
        function extractEvents$1(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
          var targetNode = targetInst ? getNodeFromInstance(targetInst) : window;
          var getTargetInstFunc, handleEventFunc;
          if (shouldUseChangeEvent(targetNode)) {
            getTargetInstFunc = getTargetInstForChangeEvent;
          } else if (isTextInputElement(targetNode)) {
            if (isInputEventSupported) {
              getTargetInstFunc = getTargetInstForInputOrChangeEvent;
            } else {
              getTargetInstFunc = getTargetInstForInputEventPolyfill;
              handleEventFunc = handleEventsForInputEventPolyfill;
            }
          } else if (shouldUseClickEvent(targetNode)) {
            getTargetInstFunc = getTargetInstForClickEvent;
          }
          if (getTargetInstFunc) {
            var inst = getTargetInstFunc(domEventName, targetInst);
            if (inst) {
              createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, nativeEventTarget);
              return;
            }
          }
          if (handleEventFunc) {
            handleEventFunc(domEventName, targetNode, targetInst);
          }
          if (domEventName === "focusout") {
            handleControlledInputBlur(targetNode);
          }
        }
        function registerEvents$2() {
          registerDirectEvent("onMouseEnter", ["mouseout", "mouseover"]);
          registerDirectEvent("onMouseLeave", ["mouseout", "mouseover"]);
          registerDirectEvent("onPointerEnter", ["pointerout", "pointerover"]);
          registerDirectEvent("onPointerLeave", ["pointerout", "pointerover"]);
        }
        function extractEvents$2(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
          var isOverEvent = domEventName === "mouseover" || domEventName === "pointerover";
          var isOutEvent = domEventName === "mouseout" || domEventName === "pointerout";
          if (isOverEvent && !isReplayingEvent(nativeEvent)) {
            var related = nativeEvent.relatedTarget || nativeEvent.fromElement;
            if (related) {
              if (getClosestInstanceFromNode(related) || isContainerMarkedAsRoot(related)) {
                return;
              }
            }
          }
          if (!isOutEvent && !isOverEvent) {
            return;
          }
          var win;
          if (nativeEventTarget.window === nativeEventTarget) {
            win = nativeEventTarget;
          } else {
            var doc = nativeEventTarget.ownerDocument;
            if (doc) {
              win = doc.defaultView || doc.parentWindow;
            } else {
              win = window;
            }
          }
          var from;
          var to;
          if (isOutEvent) {
            var _related = nativeEvent.relatedTarget || nativeEvent.toElement;
            from = targetInst;
            to = _related ? getClosestInstanceFromNode(_related) : null;
            if (to !== null) {
              var nearestMounted = getNearestMountedFiber(to);
              if (to !== nearestMounted || to.tag !== HostComponent && to.tag !== HostText) {
                to = null;
              }
            }
          } else {
            from = null;
            to = targetInst;
          }
          if (from === to) {
            return;
          }
          var SyntheticEventCtor = SyntheticMouseEvent;
          var leaveEventType = "onMouseLeave";
          var enterEventType = "onMouseEnter";
          var eventTypePrefix = "mouse";
          if (domEventName === "pointerout" || domEventName === "pointerover") {
            SyntheticEventCtor = SyntheticPointerEvent;
            leaveEventType = "onPointerLeave";
            enterEventType = "onPointerEnter";
            eventTypePrefix = "pointer";
          }
          var fromNode = from == null ? win : getNodeFromInstance(from);
          var toNode = to == null ? win : getNodeFromInstance(to);
          var leave = new SyntheticEventCtor(leaveEventType, eventTypePrefix + "leave", from, nativeEvent, nativeEventTarget);
          leave.target = fromNode;
          leave.relatedTarget = toNode;
          var enter = null;
          var nativeTargetInst = getClosestInstanceFromNode(nativeEventTarget);
          if (nativeTargetInst === targetInst) {
            var enterEvent = new SyntheticEventCtor(enterEventType, eventTypePrefix + "enter", to, nativeEvent, nativeEventTarget);
            enterEvent.target = toNode;
            enterEvent.relatedTarget = fromNode;
            enter = enterEvent;
          }
          accumulateEnterLeaveTwoPhaseListeners(dispatchQueue, leave, enter, from, to);
        }
        function is(x, y) {
          return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
        }
        var objectIs = typeof Object.is === "function" ? Object.is : is;
        function shallowEqual(objA, objB) {
          if (objectIs(objA, objB)) {
            return true;
          }
          if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
            return false;
          }
          var keysA = Object.keys(objA);
          var keysB = Object.keys(objB);
          if (keysA.length !== keysB.length) {
            return false;
          }
          for (var i = 0; i < keysA.length; i++) {
            var currentKey = keysA[i];
            if (!hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey])) {
              return false;
            }
          }
          return true;
        }
        function getLeafNode(node) {
          while (node && node.firstChild) {
            node = node.firstChild;
          }
          return node;
        }
        function getSiblingNode(node) {
          while (node) {
            if (node.nextSibling) {
              return node.nextSibling;
            }
            node = node.parentNode;
          }
        }
        function getNodeForCharacterOffset(root2, offset) {
          var node = getLeafNode(root2);
          var nodeStart = 0;
          var nodeEnd = 0;
          while (node) {
            if (node.nodeType === TEXT_NODE) {
              nodeEnd = nodeStart + node.textContent.length;
              if (nodeStart <= offset && nodeEnd >= offset) {
                return {
                  node,
                  offset: offset - nodeStart
                };
              }
              nodeStart = nodeEnd;
            }
            node = getLeafNode(getSiblingNode(node));
          }
        }
        function getOffsets(outerNode) {
          var ownerDocument = outerNode.ownerDocument;
          var win = ownerDocument && ownerDocument.defaultView || window;
          var selection = win.getSelection && win.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return null;
          }
          var anchorNode = selection.anchorNode, anchorOffset = selection.anchorOffset, focusNode = selection.focusNode, focusOffset = selection.focusOffset;
          try {
            anchorNode.nodeType;
            focusNode.nodeType;
          } catch (e) {
            return null;
          }
          return getModernOffsetsFromPoints(outerNode, anchorNode, anchorOffset, focusNode, focusOffset);
        }
        function getModernOffsetsFromPoints(outerNode, anchorNode, anchorOffset, focusNode, focusOffset) {
          var length = 0;
          var start = -1;
          var end = -1;
          var indexWithinAnchor = 0;
          var indexWithinFocus = 0;
          var node = outerNode;
          var parentNode = null;
          outer: while (true) {
            var next = null;
            while (true) {
              if (node === anchorNode && (anchorOffset === 0 || node.nodeType === TEXT_NODE)) {
                start = length + anchorOffset;
              }
              if (node === focusNode && (focusOffset === 0 || node.nodeType === TEXT_NODE)) {
                end = length + focusOffset;
              }
              if (node.nodeType === TEXT_NODE) {
                length += node.nodeValue.length;
              }
              if ((next = node.firstChild) === null) {
                break;
              }
              parentNode = node;
              node = next;
            }
            while (true) {
              if (node === outerNode) {
                break outer;
              }
              if (parentNode === anchorNode && ++indexWithinAnchor === anchorOffset) {
                start = length;
              }
              if (parentNode === focusNode && ++indexWithinFocus === focusOffset) {
                end = length;
              }
              if ((next = node.nextSibling) !== null) {
                break;
              }
              node = parentNode;
              parentNode = node.parentNode;
            }
            node = next;
          }
          if (start === -1 || end === -1) {
            return null;
          }
          return {
            start,
            end
          };
        }
        function setOffsets(node, offsets) {
          var doc = node.ownerDocument || document;
          var win = doc && doc.defaultView || window;
          if (!win.getSelection) {
            return;
          }
          var selection = win.getSelection();
          var length = node.textContent.length;
          var start = Math.min(offsets.start, length);
          var end = offsets.end === void 0 ? start : Math.min(offsets.end, length);
          if (!selection.extend && start > end) {
            var temp = end;
            end = start;
            start = temp;
          }
          var startMarker = getNodeForCharacterOffset(node, start);
          var endMarker = getNodeForCharacterOffset(node, end);
          if (startMarker && endMarker) {
            if (selection.rangeCount === 1 && selection.anchorNode === startMarker.node && selection.anchorOffset === startMarker.offset && selection.focusNode === endMarker.node && selection.focusOffset === endMarker.offset) {
              return;
            }
            var range = doc.createRange();
            range.setStart(startMarker.node, startMarker.offset);
            selection.removeAllRanges();
            if (start > end) {
              selection.addRange(range);
              selection.extend(endMarker.node, endMarker.offset);
            } else {
              range.setEnd(endMarker.node, endMarker.offset);
              selection.addRange(range);
            }
          }
        }
        function isTextNode(node) {
          return node && node.nodeType === TEXT_NODE;
        }
        function containsNode(outerNode, innerNode) {
          if (!outerNode || !innerNode) {
            return false;
          } else if (outerNode === innerNode) {
            return true;
          } else if (isTextNode(outerNode)) {
            return false;
          } else if (isTextNode(innerNode)) {
            return containsNode(outerNode, innerNode.parentNode);
          } else if ("contains" in outerNode) {
            return outerNode.contains(innerNode);
          } else if (outerNode.compareDocumentPosition) {
            return !!(outerNode.compareDocumentPosition(innerNode) & 16);
          } else {
            return false;
          }
        }
        function isInDocument(node) {
          return node && node.ownerDocument && containsNode(node.ownerDocument.documentElement, node);
        }
        function isSameOriginFrame(iframe) {
          try {
            return typeof iframe.contentWindow.location.href === "string";
          } catch (err) {
            return false;
          }
        }
        function getActiveElementDeep() {
          var win = window;
          var element = getActiveElement();
          while (element instanceof win.HTMLIFrameElement) {
            if (isSameOriginFrame(element)) {
              win = element.contentWindow;
            } else {
              return element;
            }
            element = getActiveElement(win.document);
          }
          return element;
        }
        function hasSelectionCapabilities(elem) {
          var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
          return nodeName && (nodeName === "input" && (elem.type === "text" || elem.type === "search" || elem.type === "tel" || elem.type === "url" || elem.type === "password") || nodeName === "textarea" || elem.contentEditable === "true");
        }
        function getSelectionInformation() {
          var focusedElem = getActiveElementDeep();
          return {
            focusedElem,
            selectionRange: hasSelectionCapabilities(focusedElem) ? getSelection(focusedElem) : null
          };
        }
        function restoreSelection(priorSelectionInformation) {
          var curFocusedElem = getActiveElementDeep();
          var priorFocusedElem = priorSelectionInformation.focusedElem;
          var priorSelectionRange = priorSelectionInformation.selectionRange;
          if (curFocusedElem !== priorFocusedElem && isInDocument(priorFocusedElem)) {
            if (priorSelectionRange !== null && hasSelectionCapabilities(priorFocusedElem)) {
              setSelection(priorFocusedElem, priorSelectionRange);
            }
            var ancestors = [];
            var ancestor = priorFocusedElem;
            while (ancestor = ancestor.parentNode) {
              if (ancestor.nodeType === ELEMENT_NODE) {
                ancestors.push({
                  element: ancestor,
                  left: ancestor.scrollLeft,
                  top: ancestor.scrollTop
                });
              }
            }
            if (typeof priorFocusedElem.focus === "function") {
              priorFocusedElem.focus();
            }
            for (var i = 0; i < ancestors.length; i++) {
              var info = ancestors[i];
              info.element.scrollLeft = info.left;
              info.element.scrollTop = info.top;
            }
          }
        }
        function getSelection(input) {
          var selection;
          if ("selectionStart" in input) {
            selection = {
              start: input.selectionStart,
              end: input.selectionEnd
            };
          } else {
            selection = getOffsets(input);
          }
          return selection || {
            start: 0,
            end: 0
          };
        }
        function setSelection(input, offsets) {
          var start = offsets.start;
          var end = offsets.end;
          if (end === void 0) {
            end = start;
          }
          if ("selectionStart" in input) {
            input.selectionStart = start;
            input.selectionEnd = Math.min(end, input.value.length);
          } else {
            setOffsets(input, offsets);
          }
        }
        var skipSelectionChangeEvent = canUseDOM && "documentMode" in document && document.documentMode <= 11;
        function registerEvents$3() {
          registerTwoPhaseEvent("onSelect", ["focusout", "contextmenu", "dragend", "focusin", "keydown", "keyup", "mousedown", "mouseup", "selectionchange"]);
        }
        var activeElement$1 = null;
        var activeElementInst$1 = null;
        var lastSelection = null;
        var mouseDown = false;
        function getSelection$1(node) {
          if ("selectionStart" in node && hasSelectionCapabilities(node)) {
            return {
              start: node.selectionStart,
              end: node.selectionEnd
            };
          } else {
            var win = node.ownerDocument && node.ownerDocument.defaultView || window;
            var selection = win.getSelection();
            return {
              anchorNode: selection.anchorNode,
              anchorOffset: selection.anchorOffset,
              focusNode: selection.focusNode,
              focusOffset: selection.focusOffset
            };
          }
        }
        function getEventTargetDocument(eventTarget) {
          return eventTarget.window === eventTarget ? eventTarget.document : eventTarget.nodeType === DOCUMENT_NODE ? eventTarget : eventTarget.ownerDocument;
        }
        function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
          var doc = getEventTargetDocument(nativeEventTarget);
          if (mouseDown || activeElement$1 == null || activeElement$1 !== getActiveElement(doc)) {
            return;
          }
          var currentSelection = getSelection$1(activeElement$1);
          if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
            lastSelection = currentSelection;
            var listeners = accumulateTwoPhaseListeners(activeElementInst$1, "onSelect");
            if (listeners.length > 0) {
              var event = new SyntheticEvent("onSelect", "select", null, nativeEvent, nativeEventTarget);
              dispatchQueue.push({
                event,
                listeners
              });
              event.target = activeElement$1;
            }
          }
        }
        function extractEvents$3(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
          var targetNode = targetInst ? getNodeFromInstance(targetInst) : window;
          switch (domEventName) {
            case "focusin":
              if (isTextInputElement(targetNode) || targetNode.contentEditable === "true") {
                activeElement$1 = targetNode;
                activeElementInst$1 = targetInst;
                lastSelection = null;
              }
              break;
            case "focusout":
              activeElement$1 = null;
              activeElementInst$1 = null;
              lastSelection = null;
              break;
            case "mousedown":
              mouseDown = true;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              mouseDown = false;
              constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
              break;
            case "selectionchange":
              if (skipSelectionChangeEvent) {
                break;
              }
            case "keydown":
            case "keyup":
              constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
          }
        }
        function makePrefixMap(styleProp, eventName) {
          var prefixes2 = {};
          prefixes2[styleProp.toLowerCase()] = eventName.toLowerCase();
          prefixes2["Webkit" + styleProp] = "webkit" + eventName;
          prefixes2["Moz" + styleProp] = "moz" + eventName;
          return prefixes2;
        }
        var vendorPrefixes = {
          animationend: makePrefixMap("Animation", "AnimationEnd"),
          animationiteration: makePrefixMap("Animation", "AnimationIteration"),
          animationstart: makePrefixMap("Animation", "AnimationStart"),
          transitionend: makePrefixMap("Transition", "TransitionEnd")
        };
        var prefixedEventNames = {};
        var style = {};
        if (canUseDOM) {
          style = document.createElement("div").style;
          if (!("AnimationEvent" in window)) {
            delete vendorPrefixes.animationend.animation;
            delete vendorPrefixes.animationiteration.animation;
            delete vendorPrefixes.animationstart.animation;
          }
          if (!("TransitionEvent" in window)) {
            delete vendorPrefixes.transitionend.transition;
          }
        }
        function getVendorPrefixedEventName(eventName) {
          if (prefixedEventNames[eventName]) {
            return prefixedEventNames[eventName];
          } else if (!vendorPrefixes[eventName]) {
            return eventName;
          }
          var prefixMap = vendorPrefixes[eventName];
          for (var styleProp in prefixMap) {
            if (prefixMap.hasOwnProperty(styleProp) && styleProp in style) {
              return prefixedEventNames[eventName] = prefixMap[styleProp];
            }
          }
          return eventName;
        }
        var ANIMATION_END = getVendorPrefixedEventName("animationend");
        var ANIMATION_ITERATION = getVendorPrefixedEventName("animationiteration");
        var ANIMATION_START = getVendorPrefixedEventName("animationstart");
        var TRANSITION_END = getVendorPrefixedEventName("transitionend");
        var topLevelEventsToReactNames = /* @__PURE__ */ new Map();
        var simpleEventPluginEvents = ["abort", "auxClick", "cancel", "canPlay", "canPlayThrough", "click", "close", "contextMenu", "copy", "cut", "drag", "dragEnd", "dragEnter", "dragExit", "dragLeave", "dragOver", "dragStart", "drop", "durationChange", "emptied", "encrypted", "ended", "error", "gotPointerCapture", "input", "invalid", "keyDown", "keyPress", "keyUp", "load", "loadedData", "loadedMetadata", "loadStart", "lostPointerCapture", "mouseDown", "mouseMove", "mouseOut", "mouseOver", "mouseUp", "paste", "pause", "play", "playing", "pointerCancel", "pointerDown", "pointerMove", "pointerOut", "pointerOver", "pointerUp", "progress", "rateChange", "reset", "resize", "seeked", "seeking", "stalled", "submit", "suspend", "timeUpdate", "touchCancel", "touchEnd", "touchStart", "volumeChange", "scroll", "toggle", "touchMove", "waiting", "wheel"];
        function registerSimpleEvent(domEventName, reactName) {
          topLevelEventsToReactNames.set(domEventName, reactName);
          registerTwoPhaseEvent(reactName, [domEventName]);
        }
        function registerSimpleEvents() {
          for (var i = 0; i < simpleEventPluginEvents.length; i++) {
            var eventName = simpleEventPluginEvents[i];
            var domEventName = eventName.toLowerCase();
            var capitalizedEvent = eventName[0].toUpperCase() + eventName.slice(1);
            registerSimpleEvent(domEventName, "on" + capitalizedEvent);
          }
          registerSimpleEvent(ANIMATION_END, "onAnimationEnd");
          registerSimpleEvent(ANIMATION_ITERATION, "onAnimationIteration");
          registerSimpleEvent(ANIMATION_START, "onAnimationStart");
          registerSimpleEvent("dblclick", "onDoubleClick");
          registerSimpleEvent("focusin", "onFocus");
          registerSimpleEvent("focusout", "onBlur");
          registerSimpleEvent(TRANSITION_END, "onTransitionEnd");
        }
        function extractEvents$4(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
          var reactName = topLevelEventsToReactNames.get(domEventName);
          if (reactName === void 0) {
            return;
          }
          var SyntheticEventCtor = SyntheticEvent;
          var reactEventType = domEventName;
          switch (domEventName) {
            case "keypress":
              if (getEventCharCode(nativeEvent) === 0) {
                return;
              }
            case "keydown":
            case "keyup":
              SyntheticEventCtor = SyntheticKeyboardEvent;
              break;
            case "focusin":
              reactEventType = "focus";
              SyntheticEventCtor = SyntheticFocusEvent;
              break;
            case "focusout":
              reactEventType = "blur";
              SyntheticEventCtor = SyntheticFocusEvent;
              break;
            case "beforeblur":
            case "afterblur":
              SyntheticEventCtor = SyntheticFocusEvent;
              break;
            case "click":
              if (nativeEvent.button === 2) {
                return;
              }
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              SyntheticEventCtor = SyntheticMouseEvent;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              SyntheticEventCtor = SyntheticDragEvent;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              SyntheticEventCtor = SyntheticTouchEvent;
              break;
            case ANIMATION_END:
            case ANIMATION_ITERATION:
            case ANIMATION_START:
              SyntheticEventCtor = SyntheticAnimationEvent;
              break;
            case TRANSITION_END:
              SyntheticEventCtor = SyntheticTransitionEvent;
              break;
            case "scroll":
              SyntheticEventCtor = SyntheticUIEvent;
              break;
            case "wheel":
              SyntheticEventCtor = SyntheticWheelEvent;
              break;
            case "copy":
            case "cut":
            case "paste":
              SyntheticEventCtor = SyntheticClipboardEvent;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              SyntheticEventCtor = SyntheticPointerEvent;
              break;
          }
          var inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
          {
            var accumulateTargetOnly = !inCapturePhase && // TODO: ideally, we'd eventually add all events from
            // nonDelegatedEvents list in DOMPluginEventSystem.
            // Then we can remove this special list.
            // This is a breaking change that can wait until React 18.
            domEventName === "scroll";
            var _listeners = accumulateSinglePhaseListeners(targetInst, reactName, nativeEvent.type, inCapturePhase, accumulateTargetOnly);
            if (_listeners.length > 0) {
              var _event = new SyntheticEventCtor(reactName, reactEventType, null, nativeEvent, nativeEventTarget);
              dispatchQueue.push({
                event: _event,
                listeners: _listeners
              });
            }
          }
        }
        registerSimpleEvents();
        registerEvents$2();
        registerEvents$1();
        registerEvents$3();
        registerEvents();
        function extractEvents$5(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
          extractEvents$4(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags);
          var shouldProcessPolyfillPlugins = (eventSystemFlags & SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS) === 0;
          if (shouldProcessPolyfillPlugins) {
            extractEvents$2(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
            extractEvents$1(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
            extractEvents$3(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
            extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
          }
        }
        var mediaEventTypes = ["abort", "canplay", "canplaythrough", "durationchange", "emptied", "encrypted", "ended", "error", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "progress", "ratechange", "resize", "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange", "waiting"];
        var nonDelegatedEvents = new Set(["cancel", "close", "invalid", "load", "scroll", "toggle"].concat(mediaEventTypes));
        function executeDispatch(event, listener, currentTarget) {
          var type = event.type || "unknown-event";
          event.currentTarget = currentTarget;
          invokeGuardedCallbackAndCatchFirstError(type, listener, void 0, event);
          event.currentTarget = null;
        }
        function processDispatchQueueItemsInOrder(event, dispatchListeners, inCapturePhase) {
          var previousInstance;
          if (inCapturePhase) {
            for (var i = dispatchListeners.length - 1; i >= 0; i--) {
              var _dispatchListeners$i = dispatchListeners[i], instance = _dispatchListeners$i.instance, currentTarget = _dispatchListeners$i.currentTarget, listener = _dispatchListeners$i.listener;
              if (instance !== previousInstance && event.isPropagationStopped()) {
                return;
              }
              executeDispatch(event, listener, currentTarget);
              previousInstance = instance;
            }
          } else {
            for (var _i = 0; _i < dispatchListeners.length; _i++) {
              var _dispatchListeners$_i = dispatchListeners[_i], _instance = _dispatchListeners$_i.instance, _currentTarget = _dispatchListeners$_i.currentTarget, _listener = _dispatchListeners$_i.listener;
              if (_instance !== previousInstance && event.isPropagationStopped()) {
                return;
              }
              executeDispatch(event, _listener, _currentTarget);
              previousInstance = _instance;
            }
          }
        }
        function processDispatchQueue(dispatchQueue, eventSystemFlags) {
          var inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
          for (var i = 0; i < dispatchQueue.length; i++) {
            var _dispatchQueue$i = dispatchQueue[i], event = _dispatchQueue$i.event, listeners = _dispatchQueue$i.listeners;
            processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
          }
          rethrowCaughtError();
        }
        function dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
          var nativeEventTarget = getEventTarget(nativeEvent);
          var dispatchQueue = [];
          extractEvents$5(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags);
          processDispatchQueue(dispatchQueue, eventSystemFlags);
        }
        function listenToNonDelegatedEvent(domEventName, targetElement) {
          {
            if (!nonDelegatedEvents.has(domEventName)) {
              error('Did not expect a listenToNonDelegatedEvent() call for "%s". This is a bug in React. Please file an issue.', domEventName);
            }
          }
          var isCapturePhaseListener = false;
          var listenerSet = getEventListenerSet(targetElement);
          var listenerSetKey = getListenerSetKey(domEventName, isCapturePhaseListener);
          if (!listenerSet.has(listenerSetKey)) {
            addTrappedEventListener(targetElement, domEventName, IS_NON_DELEGATED, isCapturePhaseListener);
            listenerSet.add(listenerSetKey);
          }
        }
        function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
          {
            if (nonDelegatedEvents.has(domEventName) && !isCapturePhaseListener) {
              error('Did not expect a listenToNativeEvent() call for "%s" in the bubble phase. This is a bug in React. Please file an issue.', domEventName);
            }
          }
          var eventSystemFlags = 0;
          if (isCapturePhaseListener) {
            eventSystemFlags |= IS_CAPTURE_PHASE;
          }
          addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
        }
        var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
        function listenToAllSupportedEvents(rootContainerElement) {
          if (!rootContainerElement[listeningMarker]) {
            rootContainerElement[listeningMarker] = true;
            allNativeEvents.forEach(function(domEventName) {
              if (domEventName !== "selectionchange") {
                if (!nonDelegatedEvents.has(domEventName)) {
                  listenToNativeEvent(domEventName, false, rootContainerElement);
                }
                listenToNativeEvent(domEventName, true, rootContainerElement);
              }
            });
            var ownerDocument = rootContainerElement.nodeType === DOCUMENT_NODE ? rootContainerElement : rootContainerElement.ownerDocument;
            if (ownerDocument !== null) {
              if (!ownerDocument[listeningMarker]) {
                ownerDocument[listeningMarker] = true;
                listenToNativeEvent("selectionchange", false, ownerDocument);
              }
            }
          }
        }
        function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener, isDeferredListenerForLegacyFBSupport) {
          var listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags);
          var isPassiveListener = void 0;
          if (passiveBrowserEventsSupported) {
            if (domEventName === "touchstart" || domEventName === "touchmove" || domEventName === "wheel") {
              isPassiveListener = true;
            }
          }
          targetContainer = targetContainer;
          var unsubscribeListener;
          if (isCapturePhaseListener) {
            if (isPassiveListener !== void 0) {
              unsubscribeListener = addEventCaptureListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
            } else {
              unsubscribeListener = addEventCaptureListener(targetContainer, domEventName, listener);
            }
          } else {
            if (isPassiveListener !== void 0) {
              unsubscribeListener = addEventBubbleListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
            } else {
              unsubscribeListener = addEventBubbleListener(targetContainer, domEventName, listener);
            }
          }
        }
        function isMatchingRootContainer(grandContainer, targetContainer) {
          return grandContainer === targetContainer || grandContainer.nodeType === COMMENT_NODE && grandContainer.parentNode === targetContainer;
        }
        function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
          var ancestorInst = targetInst;
          if ((eventSystemFlags & IS_EVENT_HANDLE_NON_MANAGED_NODE) === 0 && (eventSystemFlags & IS_NON_DELEGATED) === 0) {
            var targetContainerNode = targetContainer;
            if (targetInst !== null) {
              var node = targetInst;
              mainLoop: while (true) {
                if (node === null) {
                  return;
                }
                var nodeTag = node.tag;
                if (nodeTag === HostRoot || nodeTag === HostPortal) {
                  var container = node.stateNode.containerInfo;
                  if (isMatchingRootContainer(container, targetContainerNode)) {
                    break;
                  }
                  if (nodeTag === HostPortal) {
                    var grandNode = node.return;
                    while (grandNode !== null) {
                      var grandTag = grandNode.tag;
                      if (grandTag === HostRoot || grandTag === HostPortal) {
                        var grandContainer = grandNode.stateNode.containerInfo;
                        if (isMatchingRootContainer(grandContainer, targetContainerNode)) {
                          return;
                        }
                      }
                      grandNode = grandNode.return;
                    }
                  }
                  while (container !== null) {
                    var parentNode = getClosestInstanceFromNode(container);
                    if (parentNode === null) {
                      return;
                    }
                    var parentTag = parentNode.tag;
                    if (parentTag === HostComponent || parentTag === HostText) {
                      node = ancestorInst = parentNode;
                      continue mainLoop;
                    }
                    container = container.parentNode;
                  }
                }
                node = node.return;
              }
            }
          }
          batchedUpdates(function() {
            return dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, ancestorInst);
          });
        }
        function createDispatchListener(instance, listener, currentTarget) {
          return {
            instance,
            listener,
            currentTarget
          };
        }
        function accumulateSinglePhaseListeners(targetFiber, reactName, nativeEventType, inCapturePhase, accumulateTargetOnly, nativeEvent) {
          var captureName = reactName !== null ? reactName + "Capture" : null;
          var reactEventName = inCapturePhase ? captureName : reactName;
          var listeners = [];
          var instance = targetFiber;
          var lastHostComponent = null;
          while (instance !== null) {
            var _instance2 = instance, stateNode = _instance2.stateNode, tag = _instance2.tag;
            if (tag === HostComponent && stateNode !== null) {
              lastHostComponent = stateNode;
              if (reactEventName !== null) {
                var listener = getListener(instance, reactEventName);
                if (listener != null) {
                  listeners.push(createDispatchListener(instance, listener, lastHostComponent));
                }
              }
            }
            if (accumulateTargetOnly) {
              break;
            }
            instance = instance.return;
          }
          return listeners;
        }
        function accumulateTwoPhaseListeners(targetFiber, reactName) {
          var captureName = reactName + "Capture";
          var listeners = [];
          var instance = targetFiber;
          while (instance !== null) {
            var _instance3 = instance, stateNode = _instance3.stateNode, tag = _instance3.tag;
            if (tag === HostComponent && stateNode !== null) {
              var currentTarget = stateNode;
              var captureListener = getListener(instance, captureName);
              if (captureListener != null) {
                listeners.unshift(createDispatchListener(instance, captureListener, currentTarget));
              }
              var bubbleListener = getListener(instance, reactName);
              if (bubbleListener != null) {
                listeners.push(createDispatchListener(instance, bubbleListener, currentTarget));
              }
            }
            instance = instance.return;
          }
          return listeners;
        }
        function getParent(inst) {
          if (inst === null) {
            return null;
          }
          do {
            inst = inst.return;
          } while (inst && inst.tag !== HostComponent);
          if (inst) {
            return inst;
          }
          return null;
        }
        function getLowestCommonAncestor(instA, instB) {
          var nodeA = instA;
          var nodeB = instB;
          var depthA = 0;
          for (var tempA = nodeA; tempA; tempA = getParent(tempA)) {
            depthA++;
          }
          var depthB = 0;
          for (var tempB = nodeB; tempB; tempB = getParent(tempB)) {
            depthB++;
          }
          while (depthA - depthB > 0) {
            nodeA = getParent(nodeA);
            depthA--;
          }
          while (depthB - depthA > 0) {
            nodeB = getParent(nodeB);
            depthB--;
          }
          var depth = depthA;
          while (depth--) {
            if (nodeA === nodeB || nodeB !== null && nodeA === nodeB.alternate) {
              return nodeA;
            }
            nodeA = getParent(nodeA);
            nodeB = getParent(nodeB);
          }
          return null;
        }
        function accumulateEnterLeaveListenersForEvent(dispatchQueue, event, target, common, inCapturePhase) {
          var registrationName = event._reactName;
          var listeners = [];
          var instance = target;
          while (instance !== null) {
            if (instance === common) {
              break;
            }
            var _instance4 = instance, alternate = _instance4.alternate, stateNode = _instance4.stateNode, tag = _instance4.tag;
            if (alternate !== null && alternate === common) {
              break;
            }
            if (tag === HostComponent && stateNode !== null) {
              var currentTarget = stateNode;
              if (inCapturePhase) {
                var captureListener = getListener(instance, registrationName);
                if (captureListener != null) {
                  listeners.unshift(createDispatchListener(instance, captureListener, currentTarget));
                }
              } else if (!inCapturePhase) {
                var bubbleListener = getListener(instance, registrationName);
                if (bubbleListener != null) {
                  listeners.push(createDispatchListener(instance, bubbleListener, currentTarget));
                }
              }
            }
            instance = instance.return;
          }
          if (listeners.length !== 0) {
            dispatchQueue.push({
              event,
              listeners
            });
          }
        }
        function accumulateEnterLeaveTwoPhaseListeners(dispatchQueue, leaveEvent, enterEvent, from, to) {
          var common = from && to ? getLowestCommonAncestor(from, to) : null;
          if (from !== null) {
            accumulateEnterLeaveListenersForEvent(dispatchQueue, leaveEvent, from, common, false);
          }
          if (to !== null && enterEvent !== null) {
            accumulateEnterLeaveListenersForEvent(dispatchQueue, enterEvent, to, common, true);
          }
        }
        function getListenerSetKey(domEventName, capture) {
          return domEventName + "__" + (capture ? "capture" : "bubble");
        }
        var didWarnInvalidHydration = false;
        var DANGEROUSLY_SET_INNER_HTML = "dangerouslySetInnerHTML";
        var SUPPRESS_CONTENT_EDITABLE_WARNING = "suppressContentEditableWarning";
        var SUPPRESS_HYDRATION_WARNING = "suppressHydrationWarning";
        var AUTOFOCUS = "autoFocus";
        var CHILDREN = "children";
        var STYLE = "style";
        var HTML$1 = "__html";
        var warnedUnknownTags;
        var validatePropertiesInDevelopment;
        var warnForPropDifference;
        var warnForExtraAttributes;
        var warnForInvalidEventListener;
        var canDiffStyleForHydrationWarning;
        var normalizeHTML;
        {
          warnedUnknownTags = {
            // There are working polyfills for <dialog>. Let people use it.
            dialog: true,
            // Electron ships a custom <webview> tag to display external web content in
            // an isolated frame and process.
            // This tag is not present in non Electron environments such as JSDom which
            // is often used for testing purposes.
            // @see https://electronjs.org/docs/api/webview-tag
            webview: true
          };
          validatePropertiesInDevelopment = function(type, props) {
            validateProperties(type, props);
            validateProperties$1(type, props);
            validateProperties$2(type, props, {
              registrationNameDependencies,
              possibleRegistrationNames
            });
          };
          canDiffStyleForHydrationWarning = canUseDOM && !document.documentMode;
          warnForPropDifference = function(propName, serverValue, clientValue) {
            if (didWarnInvalidHydration) {
              return;
            }
            var normalizedClientValue = normalizeMarkupForTextOrAttribute(clientValue);
            var normalizedServerValue = normalizeMarkupForTextOrAttribute(serverValue);
            if (normalizedServerValue === normalizedClientValue) {
              return;
            }
            didWarnInvalidHydration = true;
            error("Prop `%s` did not match. Server: %s Client: %s", propName, JSON.stringify(normalizedServerValue), JSON.stringify(normalizedClientValue));
          };
          warnForExtraAttributes = function(attributeNames) {
            if (didWarnInvalidHydration) {
              return;
            }
            didWarnInvalidHydration = true;
            var names = [];
            attributeNames.forEach(function(name) {
              names.push(name);
            });
            error("Extra attributes from the server: %s", names);
          };
          warnForInvalidEventListener = function(registrationName, listener) {
            if (listener === false) {
              error("Expected `%s` listener to be a function, instead got `false`.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.", registrationName, registrationName, registrationName);
            } else {
              error("Expected `%s` listener to be a function, instead got a value of `%s` type.", registrationName, typeof listener);
            }
          };
          normalizeHTML = function(parent, html) {
            var testElement = parent.namespaceURI === HTML_NAMESPACE ? parent.ownerDocument.createElement(parent.tagName) : parent.ownerDocument.createElementNS(parent.namespaceURI, parent.tagName);
            testElement.innerHTML = html;
            return testElement.innerHTML;
          };
        }
        var NORMALIZE_NEWLINES_REGEX = /\r\n?/g;
        var NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
        function normalizeMarkupForTextOrAttribute(markup) {
          {
            checkHtmlStringCoercion(markup);
          }
          var markupString = typeof markup === "string" ? markup : "" + markup;
          return markupString.replace(NORMALIZE_NEWLINES_REGEX, "\n").replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
        }
        function checkForUnmatchedText(serverText, clientText, isConcurrentMode, shouldWarnDev) {
          var normalizedClientText = normalizeMarkupForTextOrAttribute(clientText);
          var normalizedServerText = normalizeMarkupForTextOrAttribute(serverText);
          if (normalizedServerText === normalizedClientText) {
            return;
          }
          if (shouldWarnDev) {
            {
              if (!didWarnInvalidHydration) {
                didWarnInvalidHydration = true;
                error('Text content did not match. Server: "%s" Client: "%s"', normalizedServerText, normalizedClientText);
              }
            }
          }
          if (isConcurrentMode && enableClientRenderFallbackOnTextMismatch) {
            throw new Error("Text content does not match server-rendered HTML.");
          }
        }
        function getOwnerDocumentFromRootContainer(rootContainerElement) {
          return rootContainerElement.nodeType === DOCUMENT_NODE ? rootContainerElement : rootContainerElement.ownerDocument;
        }
        function noop() {
        }
        function trapClickOnNonInteractiveElement(node) {
          node.onclick = noop;
        }
        function setInitialDOMProperties(tag, domElement, rootContainerElement, nextProps, isCustomComponentTag) {
          for (var propKey in nextProps) {
            if (!nextProps.hasOwnProperty(propKey)) {
              continue;
            }
            var nextProp = nextProps[propKey];
            if (propKey === STYLE) {
              {
                if (nextProp) {
                  Object.freeze(nextProp);
                }
              }
              setValueForStyles(domElement, nextProp);
            } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
              var nextHtml = nextProp ? nextProp[HTML$1] : void 0;
              if (nextHtml != null) {
                setInnerHTML(domElement, nextHtml);
              }
            } else if (propKey === CHILDREN) {
              if (typeof nextProp === "string") {
                var canSetTextContent = tag !== "textarea" || nextProp !== "";
                if (canSetTextContent) {
                  setTextContent(domElement, nextProp);
                }
              } else if (typeof nextProp === "number") {
                setTextContent(domElement, "" + nextProp);
              }
            } else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING) ;
            else if (propKey === AUTOFOCUS) ;
            else if (registrationNameDependencies.hasOwnProperty(propKey)) {
              if (nextProp != null) {
                if (typeof nextProp !== "function") {
                  warnForInvalidEventListener(propKey, nextProp);
                }
                if (propKey === "onScroll") {
                  listenToNonDelegatedEvent("scroll", domElement);
                }
              }
            } else if (nextProp != null) {
              setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag);
            }
          }
        }
        function updateDOMProperties(domElement, updatePayload, wasCustomComponentTag, isCustomComponentTag) {
          for (var i = 0; i < updatePayload.length; i += 2) {
            var propKey = updatePayload[i];
            var propValue = updatePayload[i + 1];
            if (propKey === STYLE) {
              setValueForStyles(domElement, propValue);
            } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
              setInnerHTML(domElement, propValue);
            } else if (propKey === CHILDREN) {
              setTextContent(domElement, propValue);
            } else {
              setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
            }
          }
        }
        function createElement(type, props, rootContainerElement, parentNamespace) {
          var isCustomComponentTag;
          var ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
          var domElement;
          var namespaceURI = parentNamespace;
          if (namespaceURI === HTML_NAMESPACE) {
            namespaceURI = getIntrinsicNamespace(type);
          }
          if (namespaceURI === HTML_NAMESPACE) {
            {
              isCustomComponentTag = isCustomComponent(type, props);
              if (!isCustomComponentTag && type !== type.toLowerCase()) {
                error("<%s /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.", type);
              }
            }
            if (type === "script") {
              var div = ownerDocument.createElement("div");
              div.innerHTML = "<script><\/script>";
              var firstChild = div.firstChild;
              domElement = div.removeChild(firstChild);
            } else if (typeof props.is === "string") {
              domElement = ownerDocument.createElement(type, {
                is: props.is
              });
            } else {
              domElement = ownerDocument.createElement(type);
              if (type === "select") {
                var node = domElement;
                if (props.multiple) {
                  node.multiple = true;
                } else if (props.size) {
                  node.size = props.size;
                }
              }
            }
          } else {
            domElement = ownerDocument.createElementNS(namespaceURI, type);
          }
          {
            if (namespaceURI === HTML_NAMESPACE) {
              if (!isCustomComponentTag && Object.prototype.toString.call(domElement) === "[object HTMLUnknownElement]" && !hasOwnProperty.call(warnedUnknownTags, type)) {
                warnedUnknownTags[type] = true;
                error("The tag <%s> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.", type);
              }
            }
          }
          return domElement;
        }
        function createTextNode(text, rootContainerElement) {
          return getOwnerDocumentFromRootContainer(rootContainerElement).createTextNode(text);
        }
        function setInitialProperties(domElement, tag, rawProps, rootContainerElement) {
          var isCustomComponentTag = isCustomComponent(tag, rawProps);
          {
            validatePropertiesInDevelopment(tag, rawProps);
          }
          var props;
          switch (tag) {
            case "dialog":
              listenToNonDelegatedEvent("cancel", domElement);
              listenToNonDelegatedEvent("close", domElement);
              props = rawProps;
              break;
            case "iframe":
            case "object":
            case "embed":
              listenToNonDelegatedEvent("load", domElement);
              props = rawProps;
              break;
            case "video":
            case "audio":
              for (var i = 0; i < mediaEventTypes.length; i++) {
                listenToNonDelegatedEvent(mediaEventTypes[i], domElement);
              }
              props = rawProps;
              break;
            case "source":
              listenToNonDelegatedEvent("error", domElement);
              props = rawProps;
              break;
            case "img":
            case "image":
            case "link":
              listenToNonDelegatedEvent("error", domElement);
              listenToNonDelegatedEvent("load", domElement);
              props = rawProps;
              break;
            case "details":
              listenToNonDelegatedEvent("toggle", domElement);
              props = rawProps;
              break;
            case "input":
              initWrapperState(domElement, rawProps);
              props = getHostProps(domElement, rawProps);
              listenToNonDelegatedEvent("invalid", domElement);
              break;
            case "option":
              validateProps(domElement, rawProps);
              props = rawProps;
              break;
            case "select":
              initWrapperState$1(domElement, rawProps);
              props = getHostProps$1(domElement, rawProps);
              listenToNonDelegatedEvent("invalid", domElement);
              break;
            case "textarea":
              initWrapperState$2(domElement, rawProps);
              props = getHostProps$2(domElement, rawProps);
              listenToNonDelegatedEvent("invalid", domElement);
              break;
            default:
              props = rawProps;
          }
          assertValidProps(tag, props);
          setInitialDOMProperties(tag, domElement, rootContainerElement, props, isCustomComponentTag);
          switch (tag) {
            case "input":
              track(domElement);
              postMountWrapper(domElement, rawProps, false);
              break;
            case "textarea":
              track(domElement);
              postMountWrapper$3(domElement);
              break;
            case "option":
              postMountWrapper$1(domElement, rawProps);
              break;
            case "select":
              postMountWrapper$2(domElement, rawProps);
              break;
            default:
              if (typeof props.onClick === "function") {
                trapClickOnNonInteractiveElement(domElement);
              }
              break;
          }
        }
        function diffProperties(domElement, tag, lastRawProps, nextRawProps, rootContainerElement) {
          {
            validatePropertiesInDevelopment(tag, nextRawProps);
          }
          var updatePayload = null;
          var lastProps;
          var nextProps;
          switch (tag) {
            case "input":
              lastProps = getHostProps(domElement, lastRawProps);
              nextProps = getHostProps(domElement, nextRawProps);
              updatePayload = [];
              break;
            case "select":
              lastProps = getHostProps$1(domElement, lastRawProps);
              nextProps = getHostProps$1(domElement, nextRawProps);
              updatePayload = [];
              break;
            case "textarea":
              lastProps = getHostProps$2(domElement, lastRawProps);
              nextProps = getHostProps$2(domElement, nextRawProps);
              updatePayload = [];
              break;
            default:
              lastProps = lastRawProps;
              nextProps = nextRawProps;
              if (typeof lastProps.onClick !== "function" && typeof nextProps.onClick === "function") {
                trapClickOnNonInteractiveElement(domElement);
              }
              break;
          }
          assertValidProps(tag, nextProps);
          var propKey;
          var styleName;
          var styleUpdates = null;
          for (propKey in lastProps) {
            if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey) || lastProps[propKey] == null) {
              continue;
            }
            if (propKey === STYLE) {
              var lastStyle = lastProps[propKey];
              for (styleName in lastStyle) {
                if (lastStyle.hasOwnProperty(styleName)) {
                  if (!styleUpdates) {
                    styleUpdates = {};
                  }
                  styleUpdates[styleName] = "";
                }
              }
            } else if (propKey === DANGEROUSLY_SET_INNER_HTML || propKey === CHILDREN) ;
            else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING) ;
            else if (propKey === AUTOFOCUS) ;
            else if (registrationNameDependencies.hasOwnProperty(propKey)) {
              if (!updatePayload) {
                updatePayload = [];
              }
            } else {
              (updatePayload = updatePayload || []).push(propKey, null);
            }
          }
          for (propKey in nextProps) {
            var nextProp = nextProps[propKey];
            var lastProp = lastProps != null ? lastProps[propKey] : void 0;
            if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || nextProp == null && lastProp == null) {
              continue;
            }
            if (propKey === STYLE) {
              {
                if (nextProp) {
                  Object.freeze(nextProp);
                }
              }
              if (lastProp) {
                for (styleName in lastProp) {
                  if (lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
                    if (!styleUpdates) {
                      styleUpdates = {};
                    }
                    styleUpdates[styleName] = "";
                  }
                }
                for (styleName in nextProp) {
                  if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]) {
                    if (!styleUpdates) {
                      styleUpdates = {};
                    }
                    styleUpdates[styleName] = nextProp[styleName];
                  }
                }
              } else {
                if (!styleUpdates) {
                  if (!updatePayload) {
                    updatePayload = [];
                  }
                  updatePayload.push(propKey, styleUpdates);
                }
                styleUpdates = nextProp;
              }
            } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
              var nextHtml = nextProp ? nextProp[HTML$1] : void 0;
              var lastHtml = lastProp ? lastProp[HTML$1] : void 0;
              if (nextHtml != null) {
                if (lastHtml !== nextHtml) {
                  (updatePayload = updatePayload || []).push(propKey, nextHtml);
                }
              }
            } else if (propKey === CHILDREN) {
              if (typeof nextProp === "string" || typeof nextProp === "number") {
                (updatePayload = updatePayload || []).push(propKey, "" + nextProp);
              }
            } else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING) ;
            else if (registrationNameDependencies.hasOwnProperty(propKey)) {
              if (nextProp != null) {
                if (typeof nextProp !== "function") {
                  warnForInvalidEventListener(propKey, nextProp);
                }
                if (propKey === "onScroll") {
                  listenToNonDelegatedEvent("scroll", domElement);
                }
              }
              if (!updatePayload && lastProp !== nextProp) {
                updatePayload = [];
              }
            } else {
              (updatePayload = updatePayload || []).push(propKey, nextProp);
            }
          }
          if (styleUpdates) {
            {
              validateShorthandPropertyCollisionInDev(styleUpdates, nextProps[STYLE]);
            }
            (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
          }
          return updatePayload;
        }
        function updateProperties(domElement, updatePayload, tag, lastRawProps, nextRawProps) {
          if (tag === "input" && nextRawProps.type === "radio" && nextRawProps.name != null) {
            updateChecked(domElement, nextRawProps);
          }
          var wasCustomComponentTag = isCustomComponent(tag, lastRawProps);
          var isCustomComponentTag = isCustomComponent(tag, nextRawProps);
          updateDOMProperties(domElement, updatePayload, wasCustomComponentTag, isCustomComponentTag);
          switch (tag) {
            case "input":
              updateWrapper(domElement, nextRawProps);
              break;
            case "textarea":
              updateWrapper$1(domElement, nextRawProps);
              break;
            case "select":
              postUpdateWrapper(domElement, nextRawProps);
              break;
          }
        }
        function getPossibleStandardName(propName) {
          {
            var lowerCasedName = propName.toLowerCase();
            if (!possibleStandardNames.hasOwnProperty(lowerCasedName)) {
              return null;
            }
            return possibleStandardNames[lowerCasedName] || null;
          }
        }
        function diffHydratedProperties(domElement, tag, rawProps, parentNamespace, rootContainerElement, isConcurrentMode, shouldWarnDev) {
          var isCustomComponentTag;
          var extraAttributeNames;
          {
            isCustomComponentTag = isCustomComponent(tag, rawProps);
            validatePropertiesInDevelopment(tag, rawProps);
          }
          switch (tag) {
            case "dialog":
              listenToNonDelegatedEvent("cancel", domElement);
              listenToNonDelegatedEvent("close", domElement);
              break;
            case "iframe":
            case "object":
            case "embed":
              listenToNonDelegatedEvent("load", domElement);
              break;
            case "video":
            case "audio":
              for (var i = 0; i < mediaEventTypes.length; i++) {
                listenToNonDelegatedEvent(mediaEventTypes[i], domElement);
              }
              break;
            case "source":
              listenToNonDelegatedEvent("error", domElement);
              break;
            case "img":
            case "image":
            case "link":
              listenToNonDelegatedEvent("error", domElement);
              listenToNonDelegatedEvent("load", domElement);
              break;
            case "details":
              listenToNonDelegatedEvent("toggle", domElement);
              break;
            case "input":
              initWrapperState(domElement, rawProps);
              listenToNonDelegatedEvent("invalid", domElement);
              break;
            case "option":
              validateProps(domElement, rawProps);
              break;
            case "select":
              initWrapperState$1(domElement, rawProps);
              listenToNonDelegatedEvent("invalid", domElement);
              break;
            case "textarea":
              initWrapperState$2(domElement, rawProps);
              listenToNonDelegatedEvent("invalid", domElement);
              break;
          }
          assertValidProps(tag, rawProps);
          {
            extraAttributeNames = /* @__PURE__ */ new Set();
            var attributes = domElement.attributes;
            for (var _i = 0; _i < attributes.length; _i++) {
              var name = attributes[_i].name.toLowerCase();
              switch (name) {
                case "value":
                  break;
                case "checked":
                  break;
                case "selected":
                  break;
                default:
                  extraAttributeNames.add(attributes[_i].name);
              }
            }
          }
          var updatePayload = null;
          for (var propKey in rawProps) {
            if (!rawProps.hasOwnProperty(propKey)) {
              continue;
            }
            var nextProp = rawProps[propKey];
            if (propKey === CHILDREN) {
              if (typeof nextProp === "string") {
                if (domElement.textContent !== nextProp) {
                  if (rawProps[SUPPRESS_HYDRATION_WARNING] !== true) {
                    checkForUnmatchedText(domElement.textContent, nextProp, isConcurrentMode, shouldWarnDev);
                  }
                  updatePayload = [CHILDREN, nextProp];
                }
              } else if (typeof nextProp === "number") {
                if (domElement.textContent !== "" + nextProp) {
                  if (rawProps[SUPPRESS_HYDRATION_WARNING] !== true) {
                    checkForUnmatchedText(domElement.textContent, nextProp, isConcurrentMode, shouldWarnDev);
                  }
                  updatePayload = [CHILDREN, "" + nextProp];
                }
              }
            } else if (registrationNameDependencies.hasOwnProperty(propKey)) {
              if (nextProp != null) {
                if (typeof nextProp !== "function") {
                  warnForInvalidEventListener(propKey, nextProp);
                }
                if (propKey === "onScroll") {
                  listenToNonDelegatedEvent("scroll", domElement);
                }
              }
            } else if (shouldWarnDev && true && // Convince Flow we've calculated it (it's DEV-only in this method.)
            typeof isCustomComponentTag === "boolean") {
              var serverValue = void 0;
              var propertyInfo = isCustomComponentTag && enableCustomElementPropertySupport ? null : getPropertyInfo(propKey);
              if (rawProps[SUPPRESS_HYDRATION_WARNING] === true) ;
              else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING || // Controlled attributes are not validated
              // TODO: Only ignore them on controlled tags.
              propKey === "value" || propKey === "checked" || propKey === "selected") ;
              else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
                var serverHTML = domElement.innerHTML;
                var nextHtml = nextProp ? nextProp[HTML$1] : void 0;
                if (nextHtml != null) {
                  var expectedHTML = normalizeHTML(domElement, nextHtml);
                  if (expectedHTML !== serverHTML) {
                    warnForPropDifference(propKey, serverHTML, expectedHTML);
                  }
                }
              } else if (propKey === STYLE) {
                extraAttributeNames.delete(propKey);
                if (canDiffStyleForHydrationWarning) {
                  var expectedStyle = createDangerousStringForStyles(nextProp);
                  serverValue = domElement.getAttribute("style");
                  if (expectedStyle !== serverValue) {
                    warnForPropDifference(propKey, serverValue, expectedStyle);
                  }
                }
              } else if (isCustomComponentTag && !enableCustomElementPropertySupport) {
                extraAttributeNames.delete(propKey.toLowerCase());
                serverValue = getValueForAttribute(domElement, propKey, nextProp);
                if (nextProp !== serverValue) {
                  warnForPropDifference(propKey, serverValue, nextProp);
                }
              } else if (!shouldIgnoreAttribute(propKey, propertyInfo, isCustomComponentTag) && !shouldRemoveAttribute(propKey, nextProp, propertyInfo, isCustomComponentTag)) {
                var isMismatchDueToBadCasing = false;
                if (propertyInfo !== null) {
                  extraAttributeNames.delete(propertyInfo.attributeName);
                  serverValue = getValueForProperty(domElement, propKey, nextProp, propertyInfo);
                } else {
                  var ownNamespace = parentNamespace;
                  if (ownNamespace === HTML_NAMESPACE) {
                    ownNamespace = getIntrinsicNamespace(tag);
                  }
                  if (ownNamespace === HTML_NAMESPACE) {
                    extraAttributeNames.delete(propKey.toLowerCase());
                  } else {
                    var standardName = getPossibleStandardName(propKey);
                    if (standardName !== null && standardName !== propKey) {
                      isMismatchDueToBadCasing = true;
                      extraAttributeNames.delete(standardName);
                    }
                    extraAttributeNames.delete(propKey);
                  }
                  serverValue = getValueForAttribute(domElement, propKey, nextProp);
                }
                var dontWarnCustomElement = enableCustomElementPropertySupport;
                if (!dontWarnCustomElement && nextProp !== serverValue && !isMismatchDueToBadCasing) {
                  warnForPropDifference(propKey, serverValue, nextProp);
                }
              }
            }
          }
          {
            if (shouldWarnDev) {
              if (
                // $FlowFixMe - Should be inferred as not undefined.
                extraAttributeNames.size > 0 && rawProps[SUPPRESS_HYDRATION_WARNING] !== true
              ) {
                warnForExtraAttributes(extraAttributeNames);
              }
            }
          }
          switch (tag) {
            case "input":
              track(domElement);
              postMountWrapper(domElement, rawProps, true);
              break;
            case "textarea":
              track(domElement);
              postMountWrapper$3(domElement);
              break;
            case "select":
            case "option":
              break;
            default:
              if (typeof rawProps.onClick === "function") {
                trapClickOnNonInteractiveElement(domElement);
              }
              break;
          }
          return updatePayload;
        }
        function diffHydratedText(textNode, text, isConcurrentMode) {
          var isDifferent = textNode.nodeValue !== text;
          return isDifferent;
        }
        function warnForDeletedHydratableElement(parentNode, child) {
          {
            if (didWarnInvalidHydration) {
              return;
            }
            didWarnInvalidHydration = true;
            error("Did not expect server HTML to contain a <%s> in <%s>.", child.nodeName.toLowerCase(), parentNode.nodeName.toLowerCase());
          }
        }
        function warnForDeletedHydratableText(parentNode, child) {
          {
            if (didWarnInvalidHydration) {
              return;
            }
            didWarnInvalidHydration = true;
            error('Did not expect server HTML to contain the text node "%s" in <%s>.', child.nodeValue, parentNode.nodeName.toLowerCase());
          }
        }
        function warnForInsertedHydratedElement(parentNode, tag, props) {
          {
            if (didWarnInvalidHydration) {
              return;
            }
            didWarnInvalidHydration = true;
            error("Expected server HTML to contain a matching <%s> in <%s>.", tag, parentNode.nodeName.toLowerCase());
          }
        }
        function warnForInsertedHydratedText(parentNode, text) {
          {
            if (text === "") {
              return;
            }
            if (didWarnInvalidHydration) {
              return;
            }
            didWarnInvalidHydration = true;
            error('Expected server HTML to contain a matching text node for "%s" in <%s>.', text, parentNode.nodeName.toLowerCase());
          }
        }
        function restoreControlledState$3(domElement, tag, props) {
          switch (tag) {
            case "input":
              restoreControlledState(domElement, props);
              return;
            case "textarea":
              restoreControlledState$2(domElement, props);
              return;
            case "select":
              restoreControlledState$1(domElement, props);
              return;
          }
        }
        var validateDOMNesting = function() {
        };
        var updatedAncestorInfo = function() {
        };
        {
          var specialTags = ["address", "applet", "area", "article", "aside", "base", "basefont", "bgsound", "blockquote", "body", "br", "button", "caption", "center", "col", "colgroup", "dd", "details", "dir", "div", "dl", "dt", "embed", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "iframe", "img", "input", "isindex", "li", "link", "listing", "main", "marquee", "menu", "menuitem", "meta", "nav", "noembed", "noframes", "noscript", "object", "ol", "p", "param", "plaintext", "pre", "script", "section", "select", "source", "style", "summary", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "title", "tr", "track", "ul", "wbr", "xmp"];
          var inScopeTags = [
            "applet",
            "caption",
            "html",
            "table",
            "td",
            "th",
            "marquee",
            "object",
            "template",
            // https://html.spec.whatwg.org/multipage/syntax.html#html-integration-point
            // TODO: Distinguish by namespace here -- for <title>, including it here
            // errs on the side of fewer warnings
            "foreignObject",
            "desc",
            "title"
          ];
          var buttonScopeTags = inScopeTags.concat(["button"]);
          var impliedEndTags = ["dd", "dt", "li", "option", "optgroup", "p", "rp", "rt"];
          var emptyAncestorInfo = {
            current: null,
            formTag: null,
            aTagInScope: null,
            buttonTagInScope: null,
            nobrTagInScope: null,
            pTagInButtonScope: null,
            listItemTagAutoclosing: null,
            dlItemTagAutoclosing: null
          };
          updatedAncestorInfo = function(oldInfo, tag) {
            var ancestorInfo = assign({}, oldInfo || emptyAncestorInfo);
            var info = {
              tag
            };
            if (inScopeTags.indexOf(tag) !== -1) {
              ancestorInfo.aTagInScope = null;
              ancestorInfo.buttonTagInScope = null;
              ancestorInfo.nobrTagInScope = null;
            }
            if (buttonScopeTags.indexOf(tag) !== -1) {
              ancestorInfo.pTagInButtonScope = null;
            }
            if (specialTags.indexOf(tag) !== -1 && tag !== "address" && tag !== "div" && tag !== "p") {
              ancestorInfo.listItemTagAutoclosing = null;
              ancestorInfo.dlItemTagAutoclosing = null;
            }
            ancestorInfo.current = info;
            if (tag === "form") {
              ancestorInfo.formTag = info;
            }
            if (tag === "a") {
              ancestorInfo.aTagInScope = info;
            }
            if (tag === "button") {
              ancestorInfo.buttonTagInScope = info;
            }
            if (tag === "nobr") {
              ancestorInfo.nobrTagInScope = info;
            }
            if (tag === "p") {
              ancestorInfo.pTagInButtonScope = info;
            }
            if (tag === "li") {
              ancestorInfo.listItemTagAutoclosing = info;
            }
            if (tag === "dd" || tag === "dt") {
              ancestorInfo.dlItemTagAutoclosing = info;
            }
            return ancestorInfo;
          };
          var isTagValidWithParent = function(tag, parentTag) {
            switch (parentTag) {
              case "select":
                return tag === "option" || tag === "optgroup" || tag === "#text";
              case "optgroup":
                return tag === "option" || tag === "#text";
              case "option":
                return tag === "#text";
              case "tr":
                return tag === "th" || tag === "td" || tag === "style" || tag === "script" || tag === "template";
              case "tbody":
              case "thead":
              case "tfoot":
                return tag === "tr" || tag === "style" || tag === "script" || tag === "template";
              case "colgroup":
                return tag === "col" || tag === "template";
              case "table":
                return tag === "caption" || tag === "colgroup" || tag === "tbody" || tag === "tfoot" || tag === "thead" || tag === "style" || tag === "script" || tag === "template";
              case "head":
                return tag === "base" || tag === "basefont" || tag === "bgsound" || tag === "link" || tag === "meta" || tag === "title" || tag === "noscript" || tag === "noframes" || tag === "style" || tag === "script" || tag === "template";
              case "html":
                return tag === "head" || tag === "body" || tag === "frameset";
              case "frameset":
                return tag === "frame";
              case "#document":
                return tag === "html";
            }
            switch (tag) {
              case "h1":
              case "h2":
              case "h3":
              case "h4":
              case "h5":
              case "h6":
                return parentTag !== "h1" && parentTag !== "h2" && parentTag !== "h3" && parentTag !== "h4" && parentTag !== "h5" && parentTag !== "h6";
              case "rp":
              case "rt":
                return impliedEndTags.indexOf(parentTag) === -1;
              case "body":
              case "caption":
              case "col":
              case "colgroup":
              case "frameset":
              case "frame":
              case "head":
              case "html":
              case "tbody":
              case "td":
              case "tfoot":
              case "th":
              case "thead":
              case "tr":
                return parentTag == null;
            }
            return true;
          };
          var findInvalidAncestorForTag = function(tag, ancestorInfo) {
            switch (tag) {
              case "address":
              case "article":
              case "aside":
              case "blockquote":
              case "center":
              case "details":
              case "dialog":
              case "dir":
              case "div":
              case "dl":
              case "fieldset":
              case "figcaption":
              case "figure":
              case "footer":
              case "header":
              case "hgroup":
              case "main":
              case "menu":
              case "nav":
              case "ol":
              case "p":
              case "section":
              case "summary":
              case "ul":
              case "pre":
              case "listing":
              case "table":
              case "hr":
              case "xmp":
              case "h1":
              case "h2":
              case "h3":
              case "h4":
              case "h5":
              case "h6":
                return ancestorInfo.pTagInButtonScope;
              case "form":
                return ancestorInfo.formTag || ancestorInfo.pTagInButtonScope;
              case "li":
                return ancestorInfo.listItemTagAutoclosing;
              case "dd":
              case "dt":
                return ancestorInfo.dlItemTagAutoclosing;
              case "button":
                return ancestorInfo.buttonTagInScope;
              case "a":
                return ancestorInfo.aTagInScope;
              case "nobr":
                return ancestorInfo.nobrTagInScope;
            }
            return null;
          };
          var didWarn$1 = {};
          validateDOMNesting = function(childTag, childText, ancestorInfo) {
            ancestorInfo = ancestorInfo || emptyAncestorInfo;
            var parentInfo = ancestorInfo.current;
            var parentTag = parentInfo && parentInfo.tag;
            if (childText != null) {
              if (childTag != null) {
                error("validateDOMNesting: when childText is passed, childTag should be null");
              }
              childTag = "#text";
            }
            var invalidParent = isTagValidWithParent(childTag, parentTag) ? null : parentInfo;
            var invalidAncestor = invalidParent ? null : findInvalidAncestorForTag(childTag, ancestorInfo);
            var invalidParentOrAncestor = invalidParent || invalidAncestor;
            if (!invalidParentOrAncestor) {
              return;
            }
            var ancestorTag = invalidParentOrAncestor.tag;
            var warnKey = !!invalidParent + "|" + childTag + "|" + ancestorTag;
            if (didWarn$1[warnKey]) {
              return;
            }
            didWarn$1[warnKey] = true;
            var tagDisplayName = childTag;
            var whitespaceInfo = "";
            if (childTag === "#text") {
              if (/\S/.test(childText)) {
                tagDisplayName = "Text nodes";
              } else {
                tagDisplayName = "Whitespace text nodes";
                whitespaceInfo = " Make sure you don't have any extra whitespace between tags on each line of your source code.";
              }
            } else {
              tagDisplayName = "<" + childTag + ">";
            }
            if (invalidParent) {
              var info = "";
              if (ancestorTag === "table" && childTag === "tr") {
                info += " Add a <tbody>, <thead> or <tfoot> to your code to match the DOM tree generated by the browser.";
              }
              error("validateDOMNesting(...): %s cannot appear as a child of <%s>.%s%s", tagDisplayName, ancestorTag, whitespaceInfo, info);
            } else {
              error("validateDOMNesting(...): %s cannot appear as a descendant of <%s>.", tagDisplayName, ancestorTag);
            }
          };
        }
        var SUPPRESS_HYDRATION_WARNING$1 = "suppressHydrationWarning";
        var SUSPENSE_START_DATA = "$";
        var SUSPENSE_END_DATA = "/$";
        var SUSPENSE_PENDING_START_DATA = "$?";
        var SUSPENSE_FALLBACK_START_DATA = "$!";
        var STYLE$1 = "style";
        var eventsEnabled = null;
        var selectionInformation = null;
        function getRootHostContext(rootContainerInstance) {
          var type;
          var namespace;
          var nodeType = rootContainerInstance.nodeType;
          switch (nodeType) {
            case DOCUMENT_NODE:
            case DOCUMENT_FRAGMENT_NODE: {
              type = nodeType === DOCUMENT_NODE ? "#document" : "#fragment";
              var root2 = rootContainerInstance.documentElement;
              namespace = root2 ? root2.namespaceURI : getChildNamespace(null, "");
              break;
            }
            default: {
              var container = nodeType === COMMENT_NODE ? rootContainerInstance.parentNode : rootContainerInstance;
              var ownNamespace = container.namespaceURI || null;
              type = container.tagName;
              namespace = getChildNamespace(ownNamespace, type);
              break;
            }
          }
          {
            var validatedTag = type.toLowerCase();
            var ancestorInfo = updatedAncestorInfo(null, validatedTag);
            return {
              namespace,
              ancestorInfo
            };
          }
        }
        function getChildHostContext(parentHostContext, type, rootContainerInstance) {
          {
            var parentHostContextDev = parentHostContext;
            var namespace = getChildNamespace(parentHostContextDev.namespace, type);
            var ancestorInfo = updatedAncestorInfo(parentHostContextDev.ancestorInfo, type);
            return {
              namespace,
              ancestorInfo
            };
          }
        }
        function getPublicInstance(instance) {
          return instance;
        }
        function prepareForCommit(containerInfo) {
          eventsEnabled = isEnabled();
          selectionInformation = getSelectionInformation();
          var activeInstance = null;
          setEnabled(false);
          return activeInstance;
        }
        function resetAfterCommit(containerInfo) {
          restoreSelection(selectionInformation);
          setEnabled(eventsEnabled);
          eventsEnabled = null;
          selectionInformation = null;
        }
        function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
          var parentNamespace;
          {
            var hostContextDev = hostContext;
            validateDOMNesting(type, null, hostContextDev.ancestorInfo);
            if (typeof props.children === "string" || typeof props.children === "number") {
              var string = "" + props.children;
              var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type);
              validateDOMNesting(null, string, ownAncestorInfo);
            }
            parentNamespace = hostContextDev.namespace;
          }
          var domElement = createElement(type, props, rootContainerInstance, parentNamespace);
          precacheFiberNode(internalInstanceHandle, domElement);
          updateFiberProps(domElement, props);
          return domElement;
        }
        function appendInitialChild(parentInstance, child) {
          parentInstance.appendChild(child);
        }
        function finalizeInitialChildren(domElement, type, props, rootContainerInstance, hostContext) {
          setInitialProperties(domElement, type, props, rootContainerInstance);
          switch (type) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              return !!props.autoFocus;
            case "img":
              return true;
            default:
              return false;
          }
        }
        function prepareUpdate(domElement, type, oldProps, newProps, rootContainerInstance, hostContext) {
          {
            var hostContextDev = hostContext;
            if (typeof newProps.children !== typeof oldProps.children && (typeof newProps.children === "string" || typeof newProps.children === "number")) {
              var string = "" + newProps.children;
              var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type);
              validateDOMNesting(null, string, ownAncestorInfo);
            }
          }
          return diffProperties(domElement, type, oldProps, newProps);
        }
        function shouldSetTextContent(type, props) {
          return type === "textarea" || type === "noscript" || typeof props.children === "string" || typeof props.children === "number" || typeof props.dangerouslySetInnerHTML === "object" && props.dangerouslySetInnerHTML !== null && props.dangerouslySetInnerHTML.__html != null;
        }
        function createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
          {
            var hostContextDev = hostContext;
            validateDOMNesting(null, text, hostContextDev.ancestorInfo);
          }
          var textNode = createTextNode(text, rootContainerInstance);
          precacheFiberNode(internalInstanceHandle, textNode);
          return textNode;
        }
        function getCurrentEventPriority() {
          var currentEvent = window.event;
          if (currentEvent === void 0) {
            return DefaultEventPriority;
          }
          return getEventPriority(currentEvent.type);
        }
        var scheduleTimeout = typeof setTimeout === "function" ? setTimeout : void 0;
        var cancelTimeout = typeof clearTimeout === "function" ? clearTimeout : void 0;
        var noTimeout = -1;
        var localPromise = typeof Promise === "function" ? Promise : void 0;
        var scheduleMicrotask = typeof queueMicrotask === "function" ? queueMicrotask : typeof localPromise !== "undefined" ? function(callback) {
          return localPromise.resolve(null).then(callback).catch(handleErrorInNextTick);
        } : scheduleTimeout;
        function handleErrorInNextTick(error2) {
          setTimeout(function() {
            throw error2;
          });
        }
        function commitMount(domElement, type, newProps, internalInstanceHandle) {
          switch (type) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              if (newProps.autoFocus) {
                domElement.focus();
              }
              return;
            case "img": {
              if (newProps.src) {
                domElement.src = newProps.src;
              }
              return;
            }
          }
        }
        function commitUpdate(domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
          updateProperties(domElement, updatePayload, type, oldProps, newProps);
          updateFiberProps(domElement, newProps);
        }
        function resetTextContent(domElement) {
          setTextContent(domElement, "");
        }
        function commitTextUpdate(textInstance, oldText, newText) {
          textInstance.nodeValue = newText;
        }
        function appendChild(parentInstance, child) {
          parentInstance.appendChild(child);
        }
        function appendChildToContainer(container, child) {
          var parentNode;
          if (container.nodeType === COMMENT_NODE) {
            parentNode = container.parentNode;
            parentNode.insertBefore(child, container);
          } else {
            parentNode = container;
            parentNode.appendChild(child);
          }
          var reactRootContainer = container._reactRootContainer;
          if ((reactRootContainer === null || reactRootContainer === void 0) && parentNode.onclick === null) {
            trapClickOnNonInteractiveElement(parentNode);
          }
        }
        function insertBefore(parentInstance, child, beforeChild) {
          parentInstance.insertBefore(child, beforeChild);
        }
        function insertInContainerBefore(container, child, beforeChild) {
          if (container.nodeType === COMMENT_NODE) {
            container.parentNode.insertBefore(child, beforeChild);
          } else {
            container.insertBefore(child, beforeChild);
          }
        }
        function removeChild(parentInstance, child) {
          parentInstance.removeChild(child);
        }
        function removeChildFromContainer(container, child) {
          if (container.nodeType === COMMENT_NODE) {
            container.parentNode.removeChild(child);
          } else {
            container.removeChild(child);
          }
        }
        function clearSuspenseBoundary(parentInstance, suspenseInstance) {
          var node = suspenseInstance;
          var depth = 0;
          do {
            var nextNode = node.nextSibling;
            parentInstance.removeChild(node);
            if (nextNode && nextNode.nodeType === COMMENT_NODE) {
              var data = nextNode.data;
              if (data === SUSPENSE_END_DATA) {
                if (depth === 0) {
                  parentInstance.removeChild(nextNode);
                  retryIfBlockedOn(suspenseInstance);
                  return;
                } else {
                  depth--;
                }
              } else if (data === SUSPENSE_START_DATA || data === SUSPENSE_PENDING_START_DATA || data === SUSPENSE_FALLBACK_START_DATA) {
                depth++;
              }
            }
            node = nextNode;
          } while (node);
          retryIfBlockedOn(suspenseInstance);
        }
        function clearSuspenseBoundaryFromContainer(container, suspenseInstance) {
          if (container.nodeType === COMMENT_NODE) {
            clearSuspenseBoundary(container.parentNode, suspenseInstance);
          } else if (container.nodeType === ELEMENT_NODE) {
            clearSuspenseBoundary(container, suspenseInstance);
          }
          retryIfBlockedOn(container);
        }
        function hideInstance(instance) {
          instance = instance;
          var style2 = instance.style;
          if (typeof style2.setProperty === "function") {
            style2.setProperty("display", "none", "important");
          } else {
            style2.display = "none";
          }
        }
        function hideTextInstance(textInstance) {
          textInstance.nodeValue = "";
        }
        function unhideInstance(instance, props) {
          instance = instance;
          var styleProp = props[STYLE$1];
          var display = styleProp !== void 0 && styleProp !== null && styleProp.hasOwnProperty("display") ? styleProp.display : null;
          instance.style.display = dangerousStyleValue("display", display);
        }
        function unhideTextInstance(textInstance, text) {
          textInstance.nodeValue = text;
        }
        function clearContainer(container) {
          if (container.nodeType === ELEMENT_NODE) {
            container.textContent = "";
          } else if (container.nodeType === DOCUMENT_NODE) {
            if (container.documentElement) {
              container.removeChild(container.documentElement);
            }
          }
        }
        function canHydrateInstance(instance, type, props) {
          if (instance.nodeType !== ELEMENT_NODE || type.toLowerCase() !== instance.nodeName.toLowerCase()) {
            return null;
          }
          return instance;
        }
        function canHydrateTextInstance(instance, text) {
          if (text === "" || instance.nodeType !== TEXT_NODE) {
            return null;
          }
          return instance;
        }
        function canHydrateSuspenseInstance(instance) {
          if (instance.nodeType !== COMMENT_NODE) {
            return null;
          }
          return instance;
        }
        function isSuspenseInstancePending(instance) {
          return instance.data === SUSPENSE_PENDING_START_DATA;
        }
        function isSuspenseInstanceFallback(instance) {
          return instance.data === SUSPENSE_FALLBACK_START_DATA;
        }
        function getSuspenseInstanceFallbackErrorDetails(instance) {
          var dataset = instance.nextSibling && instance.nextSibling.dataset;
          var digest, message, stack;
          if (dataset) {
            digest = dataset.dgst;
            {
              message = dataset.msg;
              stack = dataset.stck;
            }
          }
          {
            return {
              message,
              digest,
              stack
            };
          }
        }
        function registerSuspenseInstanceRetry(instance, callback) {
          instance._reactRetry = callback;
        }
        function getNextHydratable(node) {
          for (; node != null; node = node.nextSibling) {
            var nodeType = node.nodeType;
            if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
              break;
            }
            if (nodeType === COMMENT_NODE) {
              var nodeData = node.data;
              if (nodeData === SUSPENSE_START_DATA || nodeData === SUSPENSE_FALLBACK_START_DATA || nodeData === SUSPENSE_PENDING_START_DATA) {
                break;
              }
              if (nodeData === SUSPENSE_END_DATA) {
                return null;
              }
            }
          }
          return node;
        }
        function getNextHydratableSibling(instance) {
          return getNextHydratable(instance.nextSibling);
        }
        function getFirstHydratableChild(parentInstance) {
          return getNextHydratable(parentInstance.firstChild);
        }
        function getFirstHydratableChildWithinContainer(parentContainer) {
          return getNextHydratable(parentContainer.firstChild);
        }
        function getFirstHydratableChildWithinSuspenseInstance(parentInstance) {
          return getNextHydratable(parentInstance.nextSibling);
        }
        function hydrateInstance(instance, type, props, rootContainerInstance, hostContext, internalInstanceHandle, shouldWarnDev) {
          precacheFiberNode(internalInstanceHandle, instance);
          updateFiberProps(instance, props);
          var parentNamespace;
          {
            var hostContextDev = hostContext;
            parentNamespace = hostContextDev.namespace;
          }
          var isConcurrentMode = (internalInstanceHandle.mode & ConcurrentMode) !== NoMode;
          return diffHydratedProperties(instance, type, props, parentNamespace, rootContainerInstance, isConcurrentMode, shouldWarnDev);
        }
        function hydrateTextInstance(textInstance, text, internalInstanceHandle, shouldWarnDev) {
          precacheFiberNode(internalInstanceHandle, textInstance);
          var isConcurrentMode = (internalInstanceHandle.mode & ConcurrentMode) !== NoMode;
          return diffHydratedText(textInstance, text);
        }
        function hydrateSuspenseInstance(suspenseInstance, internalInstanceHandle) {
          precacheFiberNode(internalInstanceHandle, suspenseInstance);
        }
        function getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance) {
          var node = suspenseInstance.nextSibling;
          var depth = 0;
          while (node) {
            if (node.nodeType === COMMENT_NODE) {
              var data = node.data;
              if (data === SUSPENSE_END_DATA) {
                if (depth === 0) {
                  return getNextHydratableSibling(node);
                } else {
                  depth--;
                }
              } else if (data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA) {
                depth++;
              }
            }
            node = node.nextSibling;
          }
          return null;
        }
        function getParentSuspenseInstance(targetInstance) {
          var node = targetInstance.previousSibling;
          var depth = 0;
          while (node) {
            if (node.nodeType === COMMENT_NODE) {
              var data = node.data;
              if (data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA) {
                if (depth === 0) {
                  return node;
                } else {
                  depth--;
                }
              } else if (data === SUSPENSE_END_DATA) {
                depth++;
              }
            }
            node = node.previousSibling;
          }
          return null;
        }
        function commitHydratedContainer(container) {
          retryIfBlockedOn(container);
        }
        function commitHydratedSuspenseInstance(suspenseInstance) {
          retryIfBlockedOn(suspenseInstance);
        }
        function shouldDeleteUnhydratedTailInstances(parentType) {
          return parentType !== "head" && parentType !== "body";
        }
        function didNotMatchHydratedContainerTextInstance(parentContainer, textInstance, text, isConcurrentMode) {
          var shouldWarnDev = true;
          checkForUnmatchedText(textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev);
        }
        function didNotMatchHydratedTextInstance(parentType, parentProps, parentInstance, textInstance, text, isConcurrentMode) {
          if (parentProps[SUPPRESS_HYDRATION_WARNING$1] !== true) {
            var shouldWarnDev = true;
            checkForUnmatchedText(textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev);
          }
        }
        function didNotHydrateInstanceWithinContainer(parentContainer, instance) {
          {
            if (instance.nodeType === ELEMENT_NODE) {
              warnForDeletedHydratableElement(parentContainer, instance);
            } else if (instance.nodeType === COMMENT_NODE) ;
            else {
              warnForDeletedHydratableText(parentContainer, instance);
            }
          }
        }
        function didNotHydrateInstanceWithinSuspenseInstance(parentInstance, instance) {
          {
            var parentNode = parentInstance.parentNode;
            if (parentNode !== null) {
              if (instance.nodeType === ELEMENT_NODE) {
                warnForDeletedHydratableElement(parentNode, instance);
              } else if (instance.nodeType === COMMENT_NODE) ;
              else {
                warnForDeletedHydratableText(parentNode, instance);
              }
            }
          }
        }
        function didNotHydrateInstance(parentType, parentProps, parentInstance, instance, isConcurrentMode) {
          {
            if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING$1] !== true) {
              if (instance.nodeType === ELEMENT_NODE) {
                warnForDeletedHydratableElement(parentInstance, instance);
              } else if (instance.nodeType === COMMENT_NODE) ;
              else {
                warnForDeletedHydratableText(parentInstance, instance);
              }
            }
          }
        }
        function didNotFindHydratableInstanceWithinContainer(parentContainer, type, props) {
          {
            warnForInsertedHydratedElement(parentContainer, type);
          }
        }
        function didNotFindHydratableTextInstanceWithinContainer(parentContainer, text) {
          {
            warnForInsertedHydratedText(parentContainer, text);
          }
        }
        function didNotFindHydratableInstanceWithinSuspenseInstance(parentInstance, type, props) {
          {
            var parentNode = parentInstance.parentNode;
            if (parentNode !== null) warnForInsertedHydratedElement(parentNode, type);
          }
        }
        function didNotFindHydratableTextInstanceWithinSuspenseInstance(parentInstance, text) {
          {
            var parentNode = parentInstance.parentNode;
            if (parentNode !== null) warnForInsertedHydratedText(parentNode, text);
          }
        }
        function didNotFindHydratableInstance(parentType, parentProps, parentInstance, type, props, isConcurrentMode) {
          {
            if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING$1] !== true) {
              warnForInsertedHydratedElement(parentInstance, type);
            }
          }
        }
        function didNotFindHydratableTextInstance(parentType, parentProps, parentInstance, text, isConcurrentMode) {
          {
            if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING$1] !== true) {
              warnForInsertedHydratedText(parentInstance, text);
            }
          }
        }
        function errorHydratingContainer(parentContainer) {
          {
            error("An error occurred during hydration. The server HTML was replaced with client content in <%s>.", parentContainer.nodeName.toLowerCase());
          }
        }
        function preparePortalMount(portalInstance) {
          listenToAllSupportedEvents(portalInstance);
        }
        var randomKey = Math.random().toString(36).slice(2);
        var internalInstanceKey = "__reactFiber$" + randomKey;
        var internalPropsKey = "__reactProps$" + randomKey;
        var internalContainerInstanceKey = "__reactContainer$" + randomKey;
        var internalEventHandlersKey = "__reactEvents$" + randomKey;
        var internalEventHandlerListenersKey = "__reactListeners$" + randomKey;
        var internalEventHandlesSetKey = "__reactHandles$" + randomKey;
        function detachDeletedInstance(node) {
          delete node[internalInstanceKey];
          delete node[internalPropsKey];
          delete node[internalEventHandlersKey];
          delete node[internalEventHandlerListenersKey];
          delete node[internalEventHandlesSetKey];
        }
        function precacheFiberNode(hostInst, node) {
          node[internalInstanceKey] = hostInst;
        }
        function markContainerAsRoot(hostRoot, node) {
          node[internalContainerInstanceKey] = hostRoot;
        }
        function unmarkContainerAsRoot(node) {
          node[internalContainerInstanceKey] = null;
        }
        function isContainerMarkedAsRoot(node) {
          return !!node[internalContainerInstanceKey];
        }
        function getClosestInstanceFromNode(targetNode) {
          var targetInst = targetNode[internalInstanceKey];
          if (targetInst) {
            return targetInst;
          }
          var parentNode = targetNode.parentNode;
          while (parentNode) {
            targetInst = parentNode[internalContainerInstanceKey] || parentNode[internalInstanceKey];
            if (targetInst) {
              var alternate = targetInst.alternate;
              if (targetInst.child !== null || alternate !== null && alternate.child !== null) {
                var suspenseInstance = getParentSuspenseInstance(targetNode);
                while (suspenseInstance !== null) {
                  var targetSuspenseInst = suspenseInstance[internalInstanceKey];
                  if (targetSuspenseInst) {
                    return targetSuspenseInst;
                  }
                  suspenseInstance = getParentSuspenseInstance(suspenseInstance);
                }
              }
              return targetInst;
            }
            targetNode = parentNode;
            parentNode = targetNode.parentNode;
          }
          return null;
        }
        function getInstanceFromNode(node) {
          var inst = node[internalInstanceKey] || node[internalContainerInstanceKey];
          if (inst) {
            if (inst.tag === HostComponent || inst.tag === HostText || inst.tag === SuspenseComponent || inst.tag === HostRoot) {
              return inst;
            } else {
              return null;
            }
          }
          return null;
        }
        function getNodeFromInstance(inst) {
          if (inst.tag === HostComponent || inst.tag === HostText) {
            return inst.stateNode;
          }
          throw new Error("getNodeFromInstance: Invalid argument.");
        }
        function getFiberCurrentPropsFromNode(node) {
          return node[internalPropsKey] || null;
        }
        function updateFiberProps(node, props) {
          node[internalPropsKey] = props;
        }
        function getEventListenerSet(node) {
          var elementListenerSet = node[internalEventHandlersKey];
          if (elementListenerSet === void 0) {
            elementListenerSet = node[internalEventHandlersKey] = /* @__PURE__ */ new Set();
          }
          return elementListenerSet;
        }
        var loggedTypeFailures = {};
        var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame$1.setExtraStackFrame(null);
            }
          }
        }
        function checkPropTypes(typeSpecs, values, location, componentName, element) {
          {
            var has2 = Function.call.bind(hasOwnProperty);
            for (var typeSpecName in typeSpecs) {
              if (has2(typeSpecs, typeSpecName)) {
                var error$1 = void 0;
                try {
                  if (typeof typeSpecs[typeSpecName] !== "function") {
                    var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                    err.name = "Invariant Violation";
                    throw err;
                  }
                  error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                } catch (ex) {
                  error$1 = ex;
                }
                if (error$1 && !(error$1 instanceof Error)) {
                  setCurrentlyValidatingElement(element);
                  error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                  setCurrentlyValidatingElement(null);
                }
                if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                  loggedTypeFailures[error$1.message] = true;
                  setCurrentlyValidatingElement(element);
                  error("Failed %s type: %s", location, error$1.message);
                  setCurrentlyValidatingElement(null);
                }
              }
            }
          }
        }
        var valueStack = [];
        var fiberStack;
        {
          fiberStack = [];
        }
        var index = -1;
        function createCursor(defaultValue) {
          return {
            current: defaultValue
          };
        }
        function pop(cursor, fiber) {
          if (index < 0) {
            {
              error("Unexpected pop.");
            }
            return;
          }
          {
            if (fiber !== fiberStack[index]) {
              error("Unexpected Fiber popped.");
            }
          }
          cursor.current = valueStack[index];
          valueStack[index] = null;
          {
            fiberStack[index] = null;
          }
          index--;
        }
        function push(cursor, value, fiber) {
          index++;
          valueStack[index] = cursor.current;
          {
            fiberStack[index] = fiber;
          }
          cursor.current = value;
        }
        var warnedAboutMissingGetChildContext;
        {
          warnedAboutMissingGetChildContext = {};
        }
        var emptyContextObject = {};
        {
          Object.freeze(emptyContextObject);
        }
        var contextStackCursor = createCursor(emptyContextObject);
        var didPerformWorkStackCursor = createCursor(false);
        var previousContext = emptyContextObject;
        function getUnmaskedContext(workInProgress2, Component, didPushOwnContextIfProvider) {
          {
            if (didPushOwnContextIfProvider && isContextProvider(Component)) {
              return previousContext;
            }
            return contextStackCursor.current;
          }
        }
        function cacheContext(workInProgress2, unmaskedContext, maskedContext) {
          {
            var instance = workInProgress2.stateNode;
            instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
            instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
          }
        }
        function getMaskedContext(workInProgress2, unmaskedContext) {
          {
            var type = workInProgress2.type;
            var contextTypes = type.contextTypes;
            if (!contextTypes) {
              return emptyContextObject;
            }
            var instance = workInProgress2.stateNode;
            if (instance && instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext) {
              return instance.__reactInternalMemoizedMaskedChildContext;
            }
            var context = {};
            for (var key in contextTypes) {
              context[key] = unmaskedContext[key];
            }
            {
              var name = getComponentNameFromFiber(workInProgress2) || "Unknown";
              checkPropTypes(contextTypes, context, "context", name);
            }
            if (instance) {
              cacheContext(workInProgress2, unmaskedContext, context);
            }
            return context;
          }
        }
        function hasContextChanged() {
          {
            return didPerformWorkStackCursor.current;
          }
        }
        function isContextProvider(type) {
          {
            var childContextTypes = type.childContextTypes;
            return childContextTypes !== null && childContextTypes !== void 0;
          }
        }
        function popContext(fiber) {
          {
            pop(didPerformWorkStackCursor, fiber);
            pop(contextStackCursor, fiber);
          }
        }
        function popTopLevelContextObject(fiber) {
          {
            pop(didPerformWorkStackCursor, fiber);
            pop(contextStackCursor, fiber);
          }
        }
        function pushTopLevelContextObject(fiber, context, didChange) {
          {
            if (contextStackCursor.current !== emptyContextObject) {
              throw new Error("Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue.");
            }
            push(contextStackCursor, context, fiber);
            push(didPerformWorkStackCursor, didChange, fiber);
          }
        }
        function processChildContext(fiber, type, parentContext) {
          {
            var instance = fiber.stateNode;
            var childContextTypes = type.childContextTypes;
            if (typeof instance.getChildContext !== "function") {
              {
                var componentName = getComponentNameFromFiber(fiber) || "Unknown";
                if (!warnedAboutMissingGetChildContext[componentName]) {
                  warnedAboutMissingGetChildContext[componentName] = true;
                  error("%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.", componentName, componentName);
                }
              }
              return parentContext;
            }
            var childContext = instance.getChildContext();
            for (var contextKey in childContext) {
              if (!(contextKey in childContextTypes)) {
                throw new Error((getComponentNameFromFiber(fiber) || "Unknown") + '.getChildContext(): key "' + contextKey + '" is not defined in childContextTypes.');
              }
            }
            {
              var name = getComponentNameFromFiber(fiber) || "Unknown";
              checkPropTypes(childContextTypes, childContext, "child context", name);
            }
            return assign({}, parentContext, childContext);
          }
        }
        function pushContextProvider(workInProgress2) {
          {
            var instance = workInProgress2.stateNode;
            var memoizedMergedChildContext = instance && instance.__reactInternalMemoizedMergedChildContext || emptyContextObject;
            previousContext = contextStackCursor.current;
            push(contextStackCursor, memoizedMergedChildContext, workInProgress2);
            push(didPerformWorkStackCursor, didPerformWorkStackCursor.current, workInProgress2);
            return true;
          }
        }
        function invalidateContextProvider(workInProgress2, type, didChange) {
          {
            var instance = workInProgress2.stateNode;
            if (!instance) {
              throw new Error("Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue.");
            }
            if (didChange) {
              var mergedContext = processChildContext(workInProgress2, type, previousContext);
              instance.__reactInternalMemoizedMergedChildContext = mergedContext;
              pop(didPerformWorkStackCursor, workInProgress2);
              pop(contextStackCursor, workInProgress2);
              push(contextStackCursor, mergedContext, workInProgress2);
              push(didPerformWorkStackCursor, didChange, workInProgress2);
            } else {
              pop(didPerformWorkStackCursor, workInProgress2);
              push(didPerformWorkStackCursor, didChange, workInProgress2);
            }
          }
        }
        function findCurrentUnmaskedContext(fiber) {
          {
            if (!isFiberMounted(fiber) || fiber.tag !== ClassComponent) {
              throw new Error("Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue.");
            }
            var node = fiber;
            do {
              switch (node.tag) {
                case HostRoot:
                  return node.stateNode.context;
                case ClassComponent: {
                  var Component = node.type;
                  if (isContextProvider(Component)) {
                    return node.stateNode.__reactInternalMemoizedMergedChildContext;
                  }
                  break;
                }
              }
              node = node.return;
            } while (node !== null);
            throw new Error("Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue.");
          }
        }
        var LegacyRoot = 0;
        var ConcurrentRoot = 1;
        var syncQueue = null;
        var includesLegacySyncCallbacks = false;
        var isFlushingSyncQueue = false;
        function scheduleSyncCallback(callback) {
          if (syncQueue === null) {
            syncQueue = [callback];
          } else {
            syncQueue.push(callback);
          }
        }
        function scheduleLegacySyncCallback(callback) {
          includesLegacySyncCallbacks = true;
          scheduleSyncCallback(callback);
        }
        function flushSyncCallbacksOnlyInLegacyMode() {
          if (includesLegacySyncCallbacks) {
            flushSyncCallbacks();
          }
        }
        function flushSyncCallbacks() {
          if (!isFlushingSyncQueue && syncQueue !== null) {
            isFlushingSyncQueue = true;
            var i = 0;
            var previousUpdatePriority = getCurrentUpdatePriority();
            try {
              var isSync = true;
              var queue = syncQueue;
              setCurrentUpdatePriority(DiscreteEventPriority);
              for (; i < queue.length; i++) {
                var callback = queue[i];
                do {
                  callback = callback(isSync);
                } while (callback !== null);
              }
              syncQueue = null;
              includesLegacySyncCallbacks = false;
            } catch (error2) {
              if (syncQueue !== null) {
                syncQueue = syncQueue.slice(i + 1);
              }
              scheduleCallback(ImmediatePriority, flushSyncCallbacks);
              throw error2;
            } finally {
              setCurrentUpdatePriority(previousUpdatePriority);
              isFlushingSyncQueue = false;
            }
          }
          return null;
        }
        var forkStack = [];
        var forkStackIndex = 0;
        var treeForkProvider = null;
        var treeForkCount = 0;
        var idStack = [];
        var idStackIndex = 0;
        var treeContextProvider = null;
        var treeContextId = 1;
        var treeContextOverflow = "";
        function isForkedChild(workInProgress2) {
          warnIfNotHydrating();
          return (workInProgress2.flags & Forked) !== NoFlags;
        }
        function getForksAtLevel(workInProgress2) {
          warnIfNotHydrating();
          return treeForkCount;
        }
        function getTreeId() {
          var overflow = treeContextOverflow;
          var idWithLeadingBit = treeContextId;
          var id = idWithLeadingBit & ~getLeadingBit(idWithLeadingBit);
          return id.toString(32) + overflow;
        }
        function pushTreeFork(workInProgress2, totalChildren) {
          warnIfNotHydrating();
          forkStack[forkStackIndex++] = treeForkCount;
          forkStack[forkStackIndex++] = treeForkProvider;
          treeForkProvider = workInProgress2;
          treeForkCount = totalChildren;
        }
        function pushTreeId(workInProgress2, totalChildren, index2) {
          warnIfNotHydrating();
          idStack[idStackIndex++] = treeContextId;
          idStack[idStackIndex++] = treeContextOverflow;
          idStack[idStackIndex++] = treeContextProvider;
          treeContextProvider = workInProgress2;
          var baseIdWithLeadingBit = treeContextId;
          var baseOverflow = treeContextOverflow;
          var baseLength = getBitLength(baseIdWithLeadingBit) - 1;
          var baseId = baseIdWithLeadingBit & ~(1 << baseLength);
          var slot = index2 + 1;
          var length = getBitLength(totalChildren) + baseLength;
          if (length > 30) {
            var numberOfOverflowBits = baseLength - baseLength % 5;
            var newOverflowBits = (1 << numberOfOverflowBits) - 1;
            var newOverflow = (baseId & newOverflowBits).toString(32);
            var restOfBaseId = baseId >> numberOfOverflowBits;
            var restOfBaseLength = baseLength - numberOfOverflowBits;
            var restOfLength = getBitLength(totalChildren) + restOfBaseLength;
            var restOfNewBits = slot << restOfBaseLength;
            var id = restOfNewBits | restOfBaseId;
            var overflow = newOverflow + baseOverflow;
            treeContextId = 1 << restOfLength | id;
            treeContextOverflow = overflow;
          } else {
            var newBits = slot << baseLength;
            var _id = newBits | baseId;
            var _overflow = baseOverflow;
            treeContextId = 1 << length | _id;
            treeContextOverflow = _overflow;
          }
        }
        function pushMaterializedTreeId(workInProgress2) {
          warnIfNotHydrating();
          var returnFiber = workInProgress2.return;
          if (returnFiber !== null) {
            var numberOfForks = 1;
            var slotIndex = 0;
            pushTreeFork(workInProgress2, numberOfForks);
            pushTreeId(workInProgress2, numberOfForks, slotIndex);
          }
        }
        function getBitLength(number) {
          return 32 - clz32(number);
        }
        function getLeadingBit(id) {
          return 1 << getBitLength(id) - 1;
        }
        function popTreeContext(workInProgress2) {
          while (workInProgress2 === treeForkProvider) {
            treeForkProvider = forkStack[--forkStackIndex];
            forkStack[forkStackIndex] = null;
            treeForkCount = forkStack[--forkStackIndex];
            forkStack[forkStackIndex] = null;
          }
          while (workInProgress2 === treeContextProvider) {
            treeContextProvider = idStack[--idStackIndex];
            idStack[idStackIndex] = null;
            treeContextOverflow = idStack[--idStackIndex];
            idStack[idStackIndex] = null;
            treeContextId = idStack[--idStackIndex];
            idStack[idStackIndex] = null;
          }
        }
        function getSuspendedTreeContext() {
          warnIfNotHydrating();
          if (treeContextProvider !== null) {
            return {
              id: treeContextId,
              overflow: treeContextOverflow
            };
          } else {
            return null;
          }
        }
        function restoreSuspendedTreeContext(workInProgress2, suspendedContext) {
          warnIfNotHydrating();
          idStack[idStackIndex++] = treeContextId;
          idStack[idStackIndex++] = treeContextOverflow;
          idStack[idStackIndex++] = treeContextProvider;
          treeContextId = suspendedContext.id;
          treeContextOverflow = suspendedContext.overflow;
          treeContextProvider = workInProgress2;
        }
        function warnIfNotHydrating() {
          {
            if (!getIsHydrating()) {
              error("Expected to be hydrating. This is a bug in React. Please file an issue.");
            }
          }
        }
        var hydrationParentFiber = null;
        var nextHydratableInstance = null;
        var isHydrating = false;
        var didSuspendOrErrorDEV = false;
        var hydrationErrors = null;
        function warnIfHydrating() {
          {
            if (isHydrating) {
              error("We should not be hydrating here. This is a bug in React. Please file a bug.");
            }
          }
        }
        function markDidThrowWhileHydratingDEV() {
          {
            didSuspendOrErrorDEV = true;
          }
        }
        function didSuspendOrErrorWhileHydratingDEV() {
          {
            return didSuspendOrErrorDEV;
          }
        }
        function enterHydrationState(fiber) {
          var parentInstance = fiber.stateNode.containerInfo;
          nextHydratableInstance = getFirstHydratableChildWithinContainer(parentInstance);
          hydrationParentFiber = fiber;
          isHydrating = true;
          hydrationErrors = null;
          didSuspendOrErrorDEV = false;
          return true;
        }
        function reenterHydrationStateFromDehydratedSuspenseInstance(fiber, suspenseInstance, treeContext) {
          nextHydratableInstance = getFirstHydratableChildWithinSuspenseInstance(suspenseInstance);
          hydrationParentFiber = fiber;
          isHydrating = true;
          hydrationErrors = null;
          didSuspendOrErrorDEV = false;
          if (treeContext !== null) {
            restoreSuspendedTreeContext(fiber, treeContext);
          }
          return true;
        }
        function warnUnhydratedInstance(returnFiber, instance) {
          {
            switch (returnFiber.tag) {
              case HostRoot: {
                didNotHydrateInstanceWithinContainer(returnFiber.stateNode.containerInfo, instance);
                break;
              }
              case HostComponent: {
                var isConcurrentMode = (returnFiber.mode & ConcurrentMode) !== NoMode;
                didNotHydrateInstance(
                  returnFiber.type,
                  returnFiber.memoizedProps,
                  returnFiber.stateNode,
                  instance,
                  // TODO: Delete this argument when we remove the legacy root API.
                  isConcurrentMode
                );
                break;
              }
              case SuspenseComponent: {
                var suspenseState = returnFiber.memoizedState;
                if (suspenseState.dehydrated !== null) didNotHydrateInstanceWithinSuspenseInstance(suspenseState.dehydrated, instance);
                break;
              }
            }
          }
        }
        function deleteHydratableInstance(returnFiber, instance) {
          warnUnhydratedInstance(returnFiber, instance);
          var childToDelete = createFiberFromHostInstanceForDeletion();
          childToDelete.stateNode = instance;
          childToDelete.return = returnFiber;
          var deletions = returnFiber.deletions;
          if (deletions === null) {
            returnFiber.deletions = [childToDelete];
            returnFiber.flags |= ChildDeletion;
          } else {
            deletions.push(childToDelete);
          }
        }
        function warnNonhydratedInstance(returnFiber, fiber) {
          {
            if (didSuspendOrErrorDEV) {
              return;
            }
            switch (returnFiber.tag) {
              case HostRoot: {
                var parentContainer = returnFiber.stateNode.containerInfo;
                switch (fiber.tag) {
                  case HostComponent:
                    var type = fiber.type;
                    var props = fiber.pendingProps;
                    didNotFindHydratableInstanceWithinContainer(parentContainer, type);
                    break;
                  case HostText:
                    var text = fiber.pendingProps;
                    didNotFindHydratableTextInstanceWithinContainer(parentContainer, text);
                    break;
                }
                break;
              }
              case HostComponent: {
                var parentType = returnFiber.type;
                var parentProps = returnFiber.memoizedProps;
                var parentInstance = returnFiber.stateNode;
                switch (fiber.tag) {
                  case HostComponent: {
                    var _type = fiber.type;
                    var _props = fiber.pendingProps;
                    var isConcurrentMode = (returnFiber.mode & ConcurrentMode) !== NoMode;
                    didNotFindHydratableInstance(
                      parentType,
                      parentProps,
                      parentInstance,
                      _type,
                      _props,
                      // TODO: Delete this argument when we remove the legacy root API.
                      isConcurrentMode
                    );
                    break;
                  }
                  case HostText: {
                    var _text = fiber.pendingProps;
                    var _isConcurrentMode = (returnFiber.mode & ConcurrentMode) !== NoMode;
                    didNotFindHydratableTextInstance(
                      parentType,
                      parentProps,
                      parentInstance,
                      _text,
                      // TODO: Delete this argument when we remove the legacy root API.
                      _isConcurrentMode
                    );
                    break;
                  }
                }
                break;
              }
              case SuspenseComponent: {
                var suspenseState = returnFiber.memoizedState;
                var _parentInstance = suspenseState.dehydrated;
                if (_parentInstance !== null) switch (fiber.tag) {
                  case HostComponent:
                    var _type2 = fiber.type;
                    var _props2 = fiber.pendingProps;
                    didNotFindHydratableInstanceWithinSuspenseInstance(_parentInstance, _type2);
                    break;
                  case HostText:
                    var _text2 = fiber.pendingProps;
                    didNotFindHydratableTextInstanceWithinSuspenseInstance(_parentInstance, _text2);
                    break;
                }
                break;
              }
              default:
                return;
            }
          }
        }
        function insertNonHydratedInstance(returnFiber, fiber) {
          fiber.flags = fiber.flags & ~Hydrating | Placement;
          warnNonhydratedInstance(returnFiber, fiber);
        }
        function tryHydrate(fiber, nextInstance) {
          switch (fiber.tag) {
            case HostComponent: {
              var type = fiber.type;
              var props = fiber.pendingProps;
              var instance = canHydrateInstance(nextInstance, type);
              if (instance !== null) {
                fiber.stateNode = instance;
                hydrationParentFiber = fiber;
                nextHydratableInstance = getFirstHydratableChild(instance);
                return true;
              }
              return false;
            }
            case HostText: {
              var text = fiber.pendingProps;
              var textInstance = canHydrateTextInstance(nextInstance, text);
              if (textInstance !== null) {
                fiber.stateNode = textInstance;
                hydrationParentFiber = fiber;
                nextHydratableInstance = null;
                return true;
              }
              return false;
            }
            case SuspenseComponent: {
              var suspenseInstance = canHydrateSuspenseInstance(nextInstance);
              if (suspenseInstance !== null) {
                var suspenseState = {
                  dehydrated: suspenseInstance,
                  treeContext: getSuspendedTreeContext(),
                  retryLane: OffscreenLane
                };
                fiber.memoizedState = suspenseState;
                var dehydratedFragment = createFiberFromDehydratedFragment(suspenseInstance);
                dehydratedFragment.return = fiber;
                fiber.child = dehydratedFragment;
                hydrationParentFiber = fiber;
                nextHydratableInstance = null;
                return true;
              }
              return false;
            }
            default:
              return false;
          }
        }
        function shouldClientRenderOnMismatch(fiber) {
          return (fiber.mode & ConcurrentMode) !== NoMode && (fiber.flags & DidCapture) === NoFlags;
        }
        function throwOnHydrationMismatch(fiber) {
          throw new Error("Hydration failed because the initial UI does not match what was rendered on the server.");
        }
        function tryToClaimNextHydratableInstance(fiber) {
          if (!isHydrating) {
            return;
          }
          var nextInstance = nextHydratableInstance;
          if (!nextInstance) {
            if (shouldClientRenderOnMismatch(fiber)) {
              warnNonhydratedInstance(hydrationParentFiber, fiber);
              throwOnHydrationMismatch();
            }
            insertNonHydratedInstance(hydrationParentFiber, fiber);
            isHydrating = false;
            hydrationParentFiber = fiber;
            return;
          }
          var firstAttemptedInstance = nextInstance;
          if (!tryHydrate(fiber, nextInstance)) {
            if (shouldClientRenderOnMismatch(fiber)) {
              warnNonhydratedInstance(hydrationParentFiber, fiber);
              throwOnHydrationMismatch();
            }
            nextInstance = getNextHydratableSibling(firstAttemptedInstance);
            var prevHydrationParentFiber = hydrationParentFiber;
            if (!nextInstance || !tryHydrate(fiber, nextInstance)) {
              insertNonHydratedInstance(hydrationParentFiber, fiber);
              isHydrating = false;
              hydrationParentFiber = fiber;
              return;
            }
            deleteHydratableInstance(prevHydrationParentFiber, firstAttemptedInstance);
          }
        }
        function prepareToHydrateHostInstance(fiber, rootContainerInstance, hostContext) {
          var instance = fiber.stateNode;
          var shouldWarnIfMismatchDev = !didSuspendOrErrorDEV;
          var updatePayload = hydrateInstance(instance, fiber.type, fiber.memoizedProps, rootContainerInstance, hostContext, fiber, shouldWarnIfMismatchDev);
          fiber.updateQueue = updatePayload;
          if (updatePayload !== null) {
            return true;
          }
          return false;
        }
        function prepareToHydrateHostTextInstance(fiber) {
          var textInstance = fiber.stateNode;
          var textContent = fiber.memoizedProps;
          var shouldUpdate = hydrateTextInstance(textInstance, textContent, fiber);
          if (shouldUpdate) {
            var returnFiber = hydrationParentFiber;
            if (returnFiber !== null) {
              switch (returnFiber.tag) {
                case HostRoot: {
                  var parentContainer = returnFiber.stateNode.containerInfo;
                  var isConcurrentMode = (returnFiber.mode & ConcurrentMode) !== NoMode;
                  didNotMatchHydratedContainerTextInstance(
                    parentContainer,
                    textInstance,
                    textContent,
                    // TODO: Delete this argument when we remove the legacy root API.
                    isConcurrentMode
                  );
                  break;
                }
                case HostComponent: {
                  var parentType = returnFiber.type;
                  var parentProps = returnFiber.memoizedProps;
                  var parentInstance = returnFiber.stateNode;
                  var _isConcurrentMode2 = (returnFiber.mode & ConcurrentMode) !== NoMode;
                  didNotMatchHydratedTextInstance(
                    parentType,
                    parentProps,
                    parentInstance,
                    textInstance,
                    textContent,
                    // TODO: Delete this argument when we remove the legacy root API.
                    _isConcurrentMode2
                  );
                  break;
                }
              }
            }
          }
          return shouldUpdate;
        }
        function prepareToHydrateHostSuspenseInstance(fiber) {
          var suspenseState = fiber.memoizedState;
          var suspenseInstance = suspenseState !== null ? suspenseState.dehydrated : null;
          if (!suspenseInstance) {
            throw new Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
          }
          hydrateSuspenseInstance(suspenseInstance, fiber);
        }
        function skipPastDehydratedSuspenseInstance(fiber) {
          var suspenseState = fiber.memoizedState;
          var suspenseInstance = suspenseState !== null ? suspenseState.dehydrated : null;
          if (!suspenseInstance) {
            throw new Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
          }
          return getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance);
        }
        function popToNextHostParent(fiber) {
          var parent = fiber.return;
          while (parent !== null && parent.tag !== HostComponent && parent.tag !== HostRoot && parent.tag !== SuspenseComponent) {
            parent = parent.return;
          }
          hydrationParentFiber = parent;
        }
        function popHydrationState(fiber) {
          if (fiber !== hydrationParentFiber) {
            return false;
          }
          if (!isHydrating) {
            popToNextHostParent(fiber);
            isHydrating = true;
            return false;
          }
          if (fiber.tag !== HostRoot && (fiber.tag !== HostComponent || shouldDeleteUnhydratedTailInstances(fiber.type) && !shouldSetTextContent(fiber.type, fiber.memoizedProps))) {
            var nextInstance = nextHydratableInstance;
            if (nextInstance) {
              if (shouldClientRenderOnMismatch(fiber)) {
                warnIfUnhydratedTailNodes(fiber);
                throwOnHydrationMismatch();
              } else {
                while (nextInstance) {
                  deleteHydratableInstance(fiber, nextInstance);
                  nextInstance = getNextHydratableSibling(nextInstance);
                }
              }
            }
          }
          popToNextHostParent(fiber);
          if (fiber.tag === SuspenseComponent) {
            nextHydratableInstance = skipPastDehydratedSuspenseInstance(fiber);
          } else {
            nextHydratableInstance = hydrationParentFiber ? getNextHydratableSibling(fiber.stateNode) : null;
          }
          return true;
        }
        function hasUnhydratedTailNodes() {
          return isHydrating && nextHydratableInstance !== null;
        }
        function warnIfUnhydratedTailNodes(fiber) {
          var nextInstance = nextHydratableInstance;
          while (nextInstance) {
            warnUnhydratedInstance(fiber, nextInstance);
            nextInstance = getNextHydratableSibling(nextInstance);
          }
        }
        function resetHydrationState() {
          hydrationParentFiber = null;
          nextHydratableInstance = null;
          isHydrating = false;
          didSuspendOrErrorDEV = false;
        }
        function upgradeHydrationErrorsToRecoverable() {
          if (hydrationErrors !== null) {
            queueRecoverableErrors(hydrationErrors);
            hydrationErrors = null;
          }
        }
        function getIsHydrating() {
          return isHydrating;
        }
        function queueHydrationError(error2) {
          if (hydrationErrors === null) {
            hydrationErrors = [error2];
          } else {
            hydrationErrors.push(error2);
          }
        }
        var ReactCurrentBatchConfig$1 = ReactSharedInternals.ReactCurrentBatchConfig;
        var NoTransition = null;
        function requestCurrentTransition() {
          return ReactCurrentBatchConfig$1.transition;
        }
        var ReactStrictModeWarnings = {
          recordUnsafeLifecycleWarnings: function(fiber, instance) {
          },
          flushPendingUnsafeLifecycleWarnings: function() {
          },
          recordLegacyContextWarning: function(fiber, instance) {
          },
          flushLegacyContextWarning: function() {
          },
          discardPendingWarnings: function() {
          }
        };
        {
          var findStrictRoot = function(fiber) {
            var maybeStrictRoot = null;
            var node = fiber;
            while (node !== null) {
              if (node.mode & StrictLegacyMode) {
                maybeStrictRoot = node;
              }
              node = node.return;
            }
            return maybeStrictRoot;
          };
          var setToSortedString = function(set2) {
            var array = [];
            set2.forEach(function(value) {
              array.push(value);
            });
            return array.sort().join(", ");
          };
          var pendingComponentWillMountWarnings = [];
          var pendingUNSAFE_ComponentWillMountWarnings = [];
          var pendingComponentWillReceivePropsWarnings = [];
          var pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
          var pendingComponentWillUpdateWarnings = [];
          var pendingUNSAFE_ComponentWillUpdateWarnings = [];
          var didWarnAboutUnsafeLifecycles = /* @__PURE__ */ new Set();
          ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = function(fiber, instance) {
            if (didWarnAboutUnsafeLifecycles.has(fiber.type)) {
              return;
            }
            if (typeof instance.componentWillMount === "function" && // Don't warn about react-lifecycles-compat polyfilled components.
            instance.componentWillMount.__suppressDeprecationWarning !== true) {
              pendingComponentWillMountWarnings.push(fiber);
            }
            if (fiber.mode & StrictLegacyMode && typeof instance.UNSAFE_componentWillMount === "function") {
              pendingUNSAFE_ComponentWillMountWarnings.push(fiber);
            }
            if (typeof instance.componentWillReceiveProps === "function" && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
              pendingComponentWillReceivePropsWarnings.push(fiber);
            }
            if (fiber.mode & StrictLegacyMode && typeof instance.UNSAFE_componentWillReceiveProps === "function") {
              pendingUNSAFE_ComponentWillReceivePropsWarnings.push(fiber);
            }
            if (typeof instance.componentWillUpdate === "function" && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
              pendingComponentWillUpdateWarnings.push(fiber);
            }
            if (fiber.mode & StrictLegacyMode && typeof instance.UNSAFE_componentWillUpdate === "function") {
              pendingUNSAFE_ComponentWillUpdateWarnings.push(fiber);
            }
          };
          ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = function() {
            var componentWillMountUniqueNames = /* @__PURE__ */ new Set();
            if (pendingComponentWillMountWarnings.length > 0) {
              pendingComponentWillMountWarnings.forEach(function(fiber) {
                componentWillMountUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
                didWarnAboutUnsafeLifecycles.add(fiber.type);
              });
              pendingComponentWillMountWarnings = [];
            }
            var UNSAFE_componentWillMountUniqueNames = /* @__PURE__ */ new Set();
            if (pendingUNSAFE_ComponentWillMountWarnings.length > 0) {
              pendingUNSAFE_ComponentWillMountWarnings.forEach(function(fiber) {
                UNSAFE_componentWillMountUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
                didWarnAboutUnsafeLifecycles.add(fiber.type);
              });
              pendingUNSAFE_ComponentWillMountWarnings = [];
            }
            var componentWillReceivePropsUniqueNames = /* @__PURE__ */ new Set();
            if (pendingComponentWillReceivePropsWarnings.length > 0) {
              pendingComponentWillReceivePropsWarnings.forEach(function(fiber) {
                componentWillReceivePropsUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
                didWarnAboutUnsafeLifecycles.add(fiber.type);
              });
              pendingComponentWillReceivePropsWarnings = [];
            }
            var UNSAFE_componentWillReceivePropsUniqueNames = /* @__PURE__ */ new Set();
            if (pendingUNSAFE_ComponentWillReceivePropsWarnings.length > 0) {
              pendingUNSAFE_ComponentWillReceivePropsWarnings.forEach(function(fiber) {
                UNSAFE_componentWillReceivePropsUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
                didWarnAboutUnsafeLifecycles.add(fiber.type);
              });
              pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
            }
            var componentWillUpdateUniqueNames = /* @__PURE__ */ new Set();
            if (pendingComponentWillUpdateWarnings.length > 0) {
              pendingComponentWillUpdateWarnings.forEach(function(fiber) {
                componentWillUpdateUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
                didWarnAboutUnsafeLifecycles.add(fiber.type);
              });
              pendingComponentWillUpdateWarnings = [];
            }
            var UNSAFE_componentWillUpdateUniqueNames = /* @__PURE__ */ new Set();
            if (pendingUNSAFE_ComponentWillUpdateWarnings.length > 0) {
              pendingUNSAFE_ComponentWillUpdateWarnings.forEach(function(fiber) {
                UNSAFE_componentWillUpdateUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
                didWarnAboutUnsafeLifecycles.add(fiber.type);
              });
              pendingUNSAFE_ComponentWillUpdateWarnings = [];
            }
            if (UNSAFE_componentWillMountUniqueNames.size > 0) {
              var sortedNames = setToSortedString(UNSAFE_componentWillMountUniqueNames);
              error("Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n* Move code with side effects to componentDidMount, and set initial state in the constructor.\n\nPlease update the following components: %s", sortedNames);
            }
            if (UNSAFE_componentWillReceivePropsUniqueNames.size > 0) {
              var _sortedNames = setToSortedString(UNSAFE_componentWillReceivePropsUniqueNames);
              error("Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state\n\nPlease update the following components: %s", _sortedNames);
            }
            if (UNSAFE_componentWillUpdateUniqueNames.size > 0) {
              var _sortedNames2 = setToSortedString(UNSAFE_componentWillUpdateUniqueNames);
              error("Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n\nPlease update the following components: %s", _sortedNames2);
            }
            if (componentWillMountUniqueNames.size > 0) {
              var _sortedNames3 = setToSortedString(componentWillMountUniqueNames);
              warn("componentWillMount has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n* Move code with side effects to componentDidMount, and set initial state in the constructor.\n* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s", _sortedNames3);
            }
            if (componentWillReceivePropsUniqueNames.size > 0) {
              var _sortedNames4 = setToSortedString(componentWillReceivePropsUniqueNames);
              warn("componentWillReceiveProps has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state\n* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s", _sortedNames4);
            }
            if (componentWillUpdateUniqueNames.size > 0) {
              var _sortedNames5 = setToSortedString(componentWillUpdateUniqueNames);
              warn("componentWillUpdate has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s", _sortedNames5);
            }
          };
          var pendingLegacyContextWarning = /* @__PURE__ */ new Map();
          var didWarnAboutLegacyContext = /* @__PURE__ */ new Set();
          ReactStrictModeWarnings.recordLegacyContextWarning = function(fiber, instance) {
            var strictRoot = findStrictRoot(fiber);
            if (strictRoot === null) {
              error("Expected to find a StrictMode component in a strict mode tree. This error is likely caused by a bug in React. Please file an issue.");
              return;
            }
            if (didWarnAboutLegacyContext.has(fiber.type)) {
              return;
            }
            var warningsForRoot = pendingLegacyContextWarning.get(strictRoot);
            if (fiber.type.contextTypes != null || fiber.type.childContextTypes != null || instance !== null && typeof instance.getChildContext === "function") {
              if (warningsForRoot === void 0) {
                warningsForRoot = [];
                pendingLegacyContextWarning.set(strictRoot, warningsForRoot);
              }
              warningsForRoot.push(fiber);
            }
          };
          ReactStrictModeWarnings.flushLegacyContextWarning = function() {
            pendingLegacyContextWarning.forEach(function(fiberArray, strictRoot) {
              if (fiberArray.length === 0) {
                return;
              }
              var firstFiber = fiberArray[0];
              var uniqueNames = /* @__PURE__ */ new Set();
              fiberArray.forEach(function(fiber) {
                uniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
                didWarnAboutLegacyContext.add(fiber.type);
              });
              var sortedNames = setToSortedString(uniqueNames);
              try {
                setCurrentFiber(firstFiber);
                error("Legacy context API has been detected within a strict-mode tree.\n\nThe old API will be supported in all 16.x releases, but applications using it should migrate to the new version.\n\nPlease update the following components: %s\n\nLearn more about this warning here: https://reactjs.org/link/legacy-context", sortedNames);
              } finally {
                resetCurrentFiber();
              }
            });
          };
          ReactStrictModeWarnings.discardPendingWarnings = function() {
            pendingComponentWillMountWarnings = [];
            pendingUNSAFE_ComponentWillMountWarnings = [];
            pendingComponentWillReceivePropsWarnings = [];
            pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
            pendingComponentWillUpdateWarnings = [];
            pendingUNSAFE_ComponentWillUpdateWarnings = [];
            pendingLegacyContextWarning = /* @__PURE__ */ new Map();
          };
        }
        var didWarnAboutMaps;
        var didWarnAboutGenerators;
        var didWarnAboutStringRefs;
        var ownerHasKeyUseWarning;
        var ownerHasFunctionTypeWarning;
        var warnForMissingKey = function(child, returnFiber) {
        };
        {
          didWarnAboutMaps = false;
          didWarnAboutGenerators = false;
          didWarnAboutStringRefs = {};
          ownerHasKeyUseWarning = {};
          ownerHasFunctionTypeWarning = {};
          warnForMissingKey = function(child, returnFiber) {
            if (child === null || typeof child !== "object") {
              return;
            }
            if (!child._store || child._store.validated || child.key != null) {
              return;
            }
            if (typeof child._store !== "object") {
              throw new Error("React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue.");
            }
            child._store.validated = true;
            var componentName = getComponentNameFromFiber(returnFiber) || "Component";
            if (ownerHasKeyUseWarning[componentName]) {
              return;
            }
            ownerHasKeyUseWarning[componentName] = true;
            error('Each child in a list should have a unique "key" prop. See https://reactjs.org/link/warning-keys for more information.');
          };
        }
        function isReactClass(type) {
          return type.prototype && type.prototype.isReactComponent;
        }
        function coerceRef(returnFiber, current2, element) {
          var mixedRef = element.ref;
          if (mixedRef !== null && typeof mixedRef !== "function" && typeof mixedRef !== "object") {
            {
              if ((returnFiber.mode & StrictLegacyMode || warnAboutStringRefs) && // We warn in ReactElement.js if owner and self are equal for string refs
              // because these cannot be automatically converted to an arrow function
              // using a codemod. Therefore, we don't have to warn about string refs again.
              !(element._owner && element._self && element._owner.stateNode !== element._self) && // Will already throw with "Function components cannot have string refs"
              !(element._owner && element._owner.tag !== ClassComponent) && // Will already warn with "Function components cannot be given refs"
              !(typeof element.type === "function" && !isReactClass(element.type)) && // Will already throw with "Element ref was specified as a string (someStringRef) but no owner was set"
              element._owner) {
                var componentName = getComponentNameFromFiber(returnFiber) || "Component";
                if (!didWarnAboutStringRefs[componentName]) {
                  {
                    error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. We recommend using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', componentName, mixedRef);
                  }
                  didWarnAboutStringRefs[componentName] = true;
                }
              }
            }
            if (element._owner) {
              var owner = element._owner;
              var inst;
              if (owner) {
                var ownerFiber = owner;
                if (ownerFiber.tag !== ClassComponent) {
                  throw new Error("Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref");
                }
                inst = ownerFiber.stateNode;
              }
              if (!inst) {
                throw new Error("Missing owner for string ref " + mixedRef + ". This error is likely caused by a bug in React. Please file an issue.");
              }
              var resolvedInst = inst;
              {
                checkPropStringCoercion(mixedRef, "ref");
              }
              var stringRef = "" + mixedRef;
              if (current2 !== null && current2.ref !== null && typeof current2.ref === "function" && current2.ref._stringRef === stringRef) {
                return current2.ref;
              }
              var ref = function(value) {
                var refs = resolvedInst.refs;
                if (value === null) {
                  delete refs[stringRef];
                } else {
                  refs[stringRef] = value;
                }
              };
              ref._stringRef = stringRef;
              return ref;
            } else {
              if (typeof mixedRef !== "string") {
                throw new Error("Expected ref to be a function, a string, an object returned by React.createRef(), or null.");
              }
              if (!element._owner) {
                throw new Error("Element ref was specified as a string (" + mixedRef + ") but no owner was set. This could happen for one of the following reasons:\n1. You may be adding a ref to a function component\n2. You may be adding a ref to a component that was not created inside a component's render method\n3. You have multiple copies of React loaded\nSee https://reactjs.org/link/refs-must-have-owner for more information.");
              }
            }
          }
          return mixedRef;
        }
        function throwOnInvalidObjectType(returnFiber, newChild) {
          var childString = Object.prototype.toString.call(newChild);
          throw new Error("Objects are not valid as a React child (found: " + (childString === "[object Object]" ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : childString) + "). If you meant to render a collection of children, use an array instead.");
        }
        function warnOnFunctionType(returnFiber) {
          {
            var componentName = getComponentNameFromFiber(returnFiber) || "Component";
            if (ownerHasFunctionTypeWarning[componentName]) {
              return;
            }
            ownerHasFunctionTypeWarning[componentName] = true;
            error("Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it.");
          }
        }
        function resolveLazy(lazyType) {
          var payload = lazyType._payload;
          var init = lazyType._init;
          return init(payload);
        }
        function ChildReconciler(shouldTrackSideEffects) {
          function deleteChild(returnFiber, childToDelete) {
            if (!shouldTrackSideEffects) {
              return;
            }
            var deletions = returnFiber.deletions;
            if (deletions === null) {
              returnFiber.deletions = [childToDelete];
              returnFiber.flags |= ChildDeletion;
            } else {
              deletions.push(childToDelete);
            }
          }
          function deleteRemainingChildren(returnFiber, currentFirstChild) {
            if (!shouldTrackSideEffects) {
              return null;
            }
            var childToDelete = currentFirstChild;
            while (childToDelete !== null) {
              deleteChild(returnFiber, childToDelete);
              childToDelete = childToDelete.sibling;
            }
            return null;
          }
          function mapRemainingChildren(returnFiber, currentFirstChild) {
            var existingChildren = /* @__PURE__ */ new Map();
            var existingChild = currentFirstChild;
            while (existingChild !== null) {
              if (existingChild.key !== null) {
                existingChildren.set(existingChild.key, existingChild);
              } else {
                existingChildren.set(existingChild.index, existingChild);
              }
              existingChild = existingChild.sibling;
            }
            return existingChildren;
          }
          function useFiber(fiber, pendingProps) {
            var clone = createWorkInProgress(fiber, pendingProps);
            clone.index = 0;
            clone.sibling = null;
            return clone;
          }
          function placeChild(newFiber, lastPlacedIndex, newIndex) {
            newFiber.index = newIndex;
            if (!shouldTrackSideEffects) {
              newFiber.flags |= Forked;
              return lastPlacedIndex;
            }
            var current2 = newFiber.alternate;
            if (current2 !== null) {
              var oldIndex = current2.index;
              if (oldIndex < lastPlacedIndex) {
                newFiber.flags |= Placement;
                return lastPlacedIndex;
              } else {
                return oldIndex;
              }
            } else {
              newFiber.flags |= Placement;
              return lastPlacedIndex;
            }
          }
          function placeSingleChild(newFiber) {
            if (shouldTrackSideEffects && newFiber.alternate === null) {
              newFiber.flags |= Placement;
            }
            return newFiber;
          }
          function updateTextNode(returnFiber, current2, textContent, lanes) {
            if (current2 === null || current2.tag !== HostText) {
              var created = createFiberFromText(textContent, returnFiber.mode, lanes);
              created.return = returnFiber;
              return created;
            } else {
              var existing = useFiber(current2, textContent);
              existing.return = returnFiber;
              return existing;
            }
          }
          function updateElement(returnFiber, current2, element, lanes) {
            var elementType = element.type;
            if (elementType === REACT_FRAGMENT_TYPE) {
              return updateFragment2(returnFiber, current2, element.props.children, lanes, element.key);
            }
            if (current2 !== null) {
              if (current2.elementType === elementType || // Keep this check inline so it only runs on the false path:
              isCompatibleFamilyForHotReloading(current2, element) || // Lazy types should reconcile their resolved type.
              // We need to do this after the Hot Reloading check above,
              // because hot reloading has different semantics than prod because
              // it doesn't resuspend. So we can't let the call below suspend.
              typeof elementType === "object" && elementType !== null && elementType.$$typeof === REACT_LAZY_TYPE && resolveLazy(elementType) === current2.type) {
                var existing = useFiber(current2, element.props);
                existing.ref = coerceRef(returnFiber, current2, element);
                existing.return = returnFiber;
                {
                  existing._debugSource = element._source;
                  existing._debugOwner = element._owner;
                }
                return existing;
              }
            }
            var created = createFiberFromElement(element, returnFiber.mode, lanes);
            created.ref = coerceRef(returnFiber, current2, element);
            created.return = returnFiber;
            return created;
          }
          function updatePortal(returnFiber, current2, portal, lanes) {
            if (current2 === null || current2.tag !== HostPortal || current2.stateNode.containerInfo !== portal.containerInfo || current2.stateNode.implementation !== portal.implementation) {
              var created = createFiberFromPortal(portal, returnFiber.mode, lanes);
              created.return = returnFiber;
              return created;
            } else {
              var existing = useFiber(current2, portal.children || []);
              existing.return = returnFiber;
              return existing;
            }
          }
          function updateFragment2(returnFiber, current2, fragment, lanes, key) {
            if (current2 === null || current2.tag !== Fragment) {
              var created = createFiberFromFragment(fragment, returnFiber.mode, lanes, key);
              created.return = returnFiber;
              return created;
            } else {
              var existing = useFiber(current2, fragment);
              existing.return = returnFiber;
              return existing;
            }
          }
          function createChild(returnFiber, newChild, lanes) {
            if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number") {
              var created = createFiberFromText("" + newChild, returnFiber.mode, lanes);
              created.return = returnFiber;
              return created;
            }
            if (typeof newChild === "object" && newChild !== null) {
              switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                  var _created = createFiberFromElement(newChild, returnFiber.mode, lanes);
                  _created.ref = coerceRef(returnFiber, null, newChild);
                  _created.return = returnFiber;
                  return _created;
                }
                case REACT_PORTAL_TYPE: {
                  var _created2 = createFiberFromPortal(newChild, returnFiber.mode, lanes);
                  _created2.return = returnFiber;
                  return _created2;
                }
                case REACT_LAZY_TYPE: {
                  var payload = newChild._payload;
                  var init = newChild._init;
                  return createChild(returnFiber, init(payload), lanes);
                }
              }
              if (isArray(newChild) || getIteratorFn(newChild)) {
                var _created3 = createFiberFromFragment(newChild, returnFiber.mode, lanes, null);
                _created3.return = returnFiber;
                return _created3;
              }
              throwOnInvalidObjectType(returnFiber, newChild);
            }
            {
              if (typeof newChild === "function") {
                warnOnFunctionType(returnFiber);
              }
            }
            return null;
          }
          function updateSlot(returnFiber, oldFiber, newChild, lanes) {
            var key = oldFiber !== null ? oldFiber.key : null;
            if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number") {
              if (key !== null) {
                return null;
              }
              return updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
            }
            if (typeof newChild === "object" && newChild !== null) {
              switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                  if (newChild.key === key) {
                    return updateElement(returnFiber, oldFiber, newChild, lanes);
                  } else {
                    return null;
                  }
                }
                case REACT_PORTAL_TYPE: {
                  if (newChild.key === key) {
                    return updatePortal(returnFiber, oldFiber, newChild, lanes);
                  } else {
                    return null;
                  }
                }
                case REACT_LAZY_TYPE: {
                  var payload = newChild._payload;
                  var init = newChild._init;
                  return updateSlot(returnFiber, oldFiber, init(payload), lanes);
                }
              }
              if (isArray(newChild) || getIteratorFn(newChild)) {
                if (key !== null) {
                  return null;
                }
                return updateFragment2(returnFiber, oldFiber, newChild, lanes, null);
              }
              throwOnInvalidObjectType(returnFiber, newChild);
            }
            {
              if (typeof newChild === "function") {
                warnOnFunctionType(returnFiber);
              }
            }
            return null;
          }
          function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
            if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number") {
              var matchedFiber = existingChildren.get(newIdx) || null;
              return updateTextNode(returnFiber, matchedFiber, "" + newChild, lanes);
            }
            if (typeof newChild === "object" && newChild !== null) {
              switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                  var _matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
                  return updateElement(returnFiber, _matchedFiber, newChild, lanes);
                }
                case REACT_PORTAL_TYPE: {
                  var _matchedFiber2 = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
                  return updatePortal(returnFiber, _matchedFiber2, newChild, lanes);
                }
                case REACT_LAZY_TYPE:
                  var payload = newChild._payload;
                  var init = newChild._init;
                  return updateFromMap(existingChildren, returnFiber, newIdx, init(payload), lanes);
              }
              if (isArray(newChild) || getIteratorFn(newChild)) {
                var _matchedFiber3 = existingChildren.get(newIdx) || null;
                return updateFragment2(returnFiber, _matchedFiber3, newChild, lanes, null);
              }
              throwOnInvalidObjectType(returnFiber, newChild);
            }
            {
              if (typeof newChild === "function") {
                warnOnFunctionType(returnFiber);
              }
            }
            return null;
          }
          function warnOnInvalidKey(child, knownKeys, returnFiber) {
            {
              if (typeof child !== "object" || child === null) {
                return knownKeys;
              }
              switch (child.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  warnForMissingKey(child, returnFiber);
                  var key = child.key;
                  if (typeof key !== "string") {
                    break;
                  }
                  if (knownKeys === null) {
                    knownKeys = /* @__PURE__ */ new Set();
                    knownKeys.add(key);
                    break;
                  }
                  if (!knownKeys.has(key)) {
                    knownKeys.add(key);
                    break;
                  }
                  error("Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.", key);
                  break;
                case REACT_LAZY_TYPE:
                  var payload = child._payload;
                  var init = child._init;
                  warnOnInvalidKey(init(payload), knownKeys, returnFiber);
                  break;
              }
            }
            return knownKeys;
          }
          function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
            {
              var knownKeys = null;
              for (var i = 0; i < newChildren.length; i++) {
                var child = newChildren[i];
                knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
              }
            }
            var resultingFirstChild = null;
            var previousNewFiber = null;
            var oldFiber = currentFirstChild;
            var lastPlacedIndex = 0;
            var newIdx = 0;
            var nextOldFiber = null;
            for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
              if (oldFiber.index > newIdx) {
                nextOldFiber = oldFiber;
                oldFiber = null;
              } else {
                nextOldFiber = oldFiber.sibling;
              }
              var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], lanes);
              if (newFiber === null) {
                if (oldFiber === null) {
                  oldFiber = nextOldFiber;
                }
                break;
              }
              if (shouldTrackSideEffects) {
                if (oldFiber && newFiber.alternate === null) {
                  deleteChild(returnFiber, oldFiber);
                }
              }
              lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
              if (previousNewFiber === null) {
                resultingFirstChild = newFiber;
              } else {
                previousNewFiber.sibling = newFiber;
              }
              previousNewFiber = newFiber;
              oldFiber = nextOldFiber;
            }
            if (newIdx === newChildren.length) {
              deleteRemainingChildren(returnFiber, oldFiber);
              if (getIsHydrating()) {
                var numberOfForks = newIdx;
                pushTreeFork(returnFiber, numberOfForks);
              }
              return resultingFirstChild;
            }
            if (oldFiber === null) {
              for (; newIdx < newChildren.length; newIdx++) {
                var _newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
                if (_newFiber === null) {
                  continue;
                }
                lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                  resultingFirstChild = _newFiber;
                } else {
                  previousNewFiber.sibling = _newFiber;
                }
                previousNewFiber = _newFiber;
              }
              if (getIsHydrating()) {
                var _numberOfForks = newIdx;
                pushTreeFork(returnFiber, _numberOfForks);
              }
              return resultingFirstChild;
            }
            var existingChildren = mapRemainingChildren(returnFiber, oldFiber);
            for (; newIdx < newChildren.length; newIdx++) {
              var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], lanes);
              if (_newFiber2 !== null) {
                if (shouldTrackSideEffects) {
                  if (_newFiber2.alternate !== null) {
                    existingChildren.delete(_newFiber2.key === null ? newIdx : _newFiber2.key);
                  }
                }
                lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                  resultingFirstChild = _newFiber2;
                } else {
                  previousNewFiber.sibling = _newFiber2;
                }
                previousNewFiber = _newFiber2;
              }
            }
            if (shouldTrackSideEffects) {
              existingChildren.forEach(function(child2) {
                return deleteChild(returnFiber, child2);
              });
            }
            if (getIsHydrating()) {
              var _numberOfForks2 = newIdx;
              pushTreeFork(returnFiber, _numberOfForks2);
            }
            return resultingFirstChild;
          }
          function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildrenIterable, lanes) {
            var iteratorFn = getIteratorFn(newChildrenIterable);
            if (typeof iteratorFn !== "function") {
              throw new Error("An object is not an iterable. This error is likely caused by a bug in React. Please file an issue.");
            }
            {
              if (typeof Symbol === "function" && // $FlowFixMe Flow doesn't know about toStringTag
              newChildrenIterable[Symbol.toStringTag] === "Generator") {
                if (!didWarnAboutGenerators) {
                  error("Using Generators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. Keep in mind you might need to polyfill these features for older browsers.");
                }
                didWarnAboutGenerators = true;
              }
              if (newChildrenIterable.entries === iteratorFn) {
                if (!didWarnAboutMaps) {
                  error("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                }
                didWarnAboutMaps = true;
              }
              var _newChildren = iteratorFn.call(newChildrenIterable);
              if (_newChildren) {
                var knownKeys = null;
                var _step = _newChildren.next();
                for (; !_step.done; _step = _newChildren.next()) {
                  var child = _step.value;
                  knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
                }
              }
            }
            var newChildren = iteratorFn.call(newChildrenIterable);
            if (newChildren == null) {
              throw new Error("An iterable object provided no iterator.");
            }
            var resultingFirstChild = null;
            var previousNewFiber = null;
            var oldFiber = currentFirstChild;
            var lastPlacedIndex = 0;
            var newIdx = 0;
            var nextOldFiber = null;
            var step = newChildren.next();
            for (; oldFiber !== null && !step.done; newIdx++, step = newChildren.next()) {
              if (oldFiber.index > newIdx) {
                nextOldFiber = oldFiber;
                oldFiber = null;
              } else {
                nextOldFiber = oldFiber.sibling;
              }
              var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
              if (newFiber === null) {
                if (oldFiber === null) {
                  oldFiber = nextOldFiber;
                }
                break;
              }
              if (shouldTrackSideEffects) {
                if (oldFiber && newFiber.alternate === null) {
                  deleteChild(returnFiber, oldFiber);
                }
              }
              lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
              if (previousNewFiber === null) {
                resultingFirstChild = newFiber;
              } else {
                previousNewFiber.sibling = newFiber;
              }
              previousNewFiber = newFiber;
              oldFiber = nextOldFiber;
            }
            if (step.done) {
              deleteRemainingChildren(returnFiber, oldFiber);
              if (getIsHydrating()) {
                var numberOfForks = newIdx;
                pushTreeFork(returnFiber, numberOfForks);
              }
              return resultingFirstChild;
            }
            if (oldFiber === null) {
              for (; !step.done; newIdx++, step = newChildren.next()) {
                var _newFiber3 = createChild(returnFiber, step.value, lanes);
                if (_newFiber3 === null) {
                  continue;
                }
                lastPlacedIndex = placeChild(_newFiber3, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                  resultingFirstChild = _newFiber3;
                } else {
                  previousNewFiber.sibling = _newFiber3;
                }
                previousNewFiber = _newFiber3;
              }
              if (getIsHydrating()) {
                var _numberOfForks3 = newIdx;
                pushTreeFork(returnFiber, _numberOfForks3);
              }
              return resultingFirstChild;
            }
            var existingChildren = mapRemainingChildren(returnFiber, oldFiber);
            for (; !step.done; newIdx++, step = newChildren.next()) {
              var _newFiber4 = updateFromMap(existingChildren, returnFiber, newIdx, step.value, lanes);
              if (_newFiber4 !== null) {
                if (shouldTrackSideEffects) {
                  if (_newFiber4.alternate !== null) {
                    existingChildren.delete(_newFiber4.key === null ? newIdx : _newFiber4.key);
                  }
                }
                lastPlacedIndex = placeChild(_newFiber4, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                  resultingFirstChild = _newFiber4;
                } else {
                  previousNewFiber.sibling = _newFiber4;
                }
                previousNewFiber = _newFiber4;
              }
            }
            if (shouldTrackSideEffects) {
              existingChildren.forEach(function(child2) {
                return deleteChild(returnFiber, child2);
              });
            }
            if (getIsHydrating()) {
              var _numberOfForks4 = newIdx;
              pushTreeFork(returnFiber, _numberOfForks4);
            }
            return resultingFirstChild;
          }
          function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent, lanes) {
            if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
              deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
              var existing = useFiber(currentFirstChild, textContent);
              existing.return = returnFiber;
              return existing;
            }
            deleteRemainingChildren(returnFiber, currentFirstChild);
            var created = createFiberFromText(textContent, returnFiber.mode, lanes);
            created.return = returnFiber;
            return created;
          }
          function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
            var key = element.key;
            var child = currentFirstChild;
            while (child !== null) {
              if (child.key === key) {
                var elementType = element.type;
                if (elementType === REACT_FRAGMENT_TYPE) {
                  if (child.tag === Fragment) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    var existing = useFiber(child, element.props.children);
                    existing.return = returnFiber;
                    {
                      existing._debugSource = element._source;
                      existing._debugOwner = element._owner;
                    }
                    return existing;
                  }
                } else {
                  if (child.elementType === elementType || // Keep this check inline so it only runs on the false path:
                  isCompatibleFamilyForHotReloading(child, element) || // Lazy types should reconcile their resolved type.
                  // We need to do this after the Hot Reloading check above,
                  // because hot reloading has different semantics than prod because
                  // it doesn't resuspend. So we can't let the call below suspend.
                  typeof elementType === "object" && elementType !== null && elementType.$$typeof === REACT_LAZY_TYPE && resolveLazy(elementType) === child.type) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    var _existing = useFiber(child, element.props);
                    _existing.ref = coerceRef(returnFiber, child, element);
                    _existing.return = returnFiber;
                    {
                      _existing._debugSource = element._source;
                      _existing._debugOwner = element._owner;
                    }
                    return _existing;
                  }
                }
                deleteRemainingChildren(returnFiber, child);
                break;
              } else {
                deleteChild(returnFiber, child);
              }
              child = child.sibling;
            }
            if (element.type === REACT_FRAGMENT_TYPE) {
              var created = createFiberFromFragment(element.props.children, returnFiber.mode, lanes, element.key);
              created.return = returnFiber;
              return created;
            } else {
              var _created4 = createFiberFromElement(element, returnFiber.mode, lanes);
              _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
              _created4.return = returnFiber;
              return _created4;
            }
          }
          function reconcileSinglePortal(returnFiber, currentFirstChild, portal, lanes) {
            var key = portal.key;
            var child = currentFirstChild;
            while (child !== null) {
              if (child.key === key) {
                if (child.tag === HostPortal && child.stateNode.containerInfo === portal.containerInfo && child.stateNode.implementation === portal.implementation) {
                  deleteRemainingChildren(returnFiber, child.sibling);
                  var existing = useFiber(child, portal.children || []);
                  existing.return = returnFiber;
                  return existing;
                } else {
                  deleteRemainingChildren(returnFiber, child);
                  break;
                }
              } else {
                deleteChild(returnFiber, child);
              }
              child = child.sibling;
            }
            var created = createFiberFromPortal(portal, returnFiber.mode, lanes);
            created.return = returnFiber;
            return created;
          }
          function reconcileChildFibers2(returnFiber, currentFirstChild, newChild, lanes) {
            var isUnkeyedTopLevelFragment = typeof newChild === "object" && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null;
            if (isUnkeyedTopLevelFragment) {
              newChild = newChild.props.children;
            }
            if (typeof newChild === "object" && newChild !== null) {
              switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                  return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes));
                case REACT_PORTAL_TYPE:
                  return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, lanes));
                case REACT_LAZY_TYPE:
                  var payload = newChild._payload;
                  var init = newChild._init;
                  return reconcileChildFibers2(returnFiber, currentFirstChild, init(payload), lanes);
              }
              if (isArray(newChild)) {
                return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes);
              }
              if (getIteratorFn(newChild)) {
                return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, lanes);
              }
              throwOnInvalidObjectType(returnFiber, newChild);
            }
            if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number") {
              return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, "" + newChild, lanes));
            }
            {
              if (typeof newChild === "function") {
                warnOnFunctionType(returnFiber);
              }
            }
            return deleteRemainingChildren(returnFiber, currentFirstChild);
          }
          return reconcileChildFibers2;
        }
        var reconcileChildFibers = ChildReconciler(true);
        var mountChildFibers = ChildReconciler(false);
        function cloneChildFibers(current2, workInProgress2) {
          if (current2 !== null && workInProgress2.child !== current2.child) {
            throw new Error("Resuming work not yet implemented.");
          }
          if (workInProgress2.child === null) {
            return;
          }
          var currentChild = workInProgress2.child;
          var newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
          workInProgress2.child = newChild;
          newChild.return = workInProgress2;
          while (currentChild.sibling !== null) {
            currentChild = currentChild.sibling;
            newChild = newChild.sibling = createWorkInProgress(currentChild, currentChild.pendingProps);
            newChild.return = workInProgress2;
          }
          newChild.sibling = null;
        }
        function resetChildFibers(workInProgress2, lanes) {
          var child = workInProgress2.child;
          while (child !== null) {
            resetWorkInProgress(child, lanes);
            child = child.sibling;
          }
        }
        var valueCursor = createCursor(null);
        var rendererSigil;
        {
          rendererSigil = {};
        }
        var currentlyRenderingFiber = null;
        var lastContextDependency = null;
        var lastFullyObservedContext = null;
        var isDisallowedContextReadInDEV = false;
        function resetContextDependencies() {
          currentlyRenderingFiber = null;
          lastContextDependency = null;
          lastFullyObservedContext = null;
          {
            isDisallowedContextReadInDEV = false;
          }
        }
        function enterDisallowedContextReadInDEV() {
          {
            isDisallowedContextReadInDEV = true;
          }
        }
        function exitDisallowedContextReadInDEV() {
          {
            isDisallowedContextReadInDEV = false;
          }
        }
        function pushProvider(providerFiber, context, nextValue) {
          {
            push(valueCursor, context._currentValue, providerFiber);
            context._currentValue = nextValue;
            {
              if (context._currentRenderer !== void 0 && context._currentRenderer !== null && context._currentRenderer !== rendererSigil) {
                error("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported.");
              }
              context._currentRenderer = rendererSigil;
            }
          }
        }
        function popProvider(context, providerFiber) {
          var currentValue = valueCursor.current;
          pop(valueCursor, providerFiber);
          {
            {
              context._currentValue = currentValue;
            }
          }
        }
        function scheduleContextWorkOnParentPath(parent, renderLanes2, propagationRoot) {
          var node = parent;
          while (node !== null) {
            var alternate = node.alternate;
            if (!isSubsetOfLanes(node.childLanes, renderLanes2)) {
              node.childLanes = mergeLanes(node.childLanes, renderLanes2);
              if (alternate !== null) {
                alternate.childLanes = mergeLanes(alternate.childLanes, renderLanes2);
              }
            } else if (alternate !== null && !isSubsetOfLanes(alternate.childLanes, renderLanes2)) {
              alternate.childLanes = mergeLanes(alternate.childLanes, renderLanes2);
            }
            if (node === propagationRoot) {
              break;
            }
            node = node.return;
          }
          {
            if (node !== propagationRoot) {
              error("Expected to find the propagation root when scheduling context work. This error is likely caused by a bug in React. Please file an issue.");
            }
          }
        }
        function propagateContextChange(workInProgress2, context, renderLanes2) {
          {
            propagateContextChange_eager(workInProgress2, context, renderLanes2);
          }
        }
        function propagateContextChange_eager(workInProgress2, context, renderLanes2) {
          var fiber = workInProgress2.child;
          if (fiber !== null) {
            fiber.return = workInProgress2;
          }
          while (fiber !== null) {
            var nextFiber = void 0;
            var list = fiber.dependencies;
            if (list !== null) {
              nextFiber = fiber.child;
              var dependency = list.firstContext;
              while (dependency !== null) {
                if (dependency.context === context) {
                  if (fiber.tag === ClassComponent) {
                    var lane = pickArbitraryLane(renderLanes2);
                    var update = createUpdate(NoTimestamp, lane);
                    update.tag = ForceUpdate;
                    var updateQueue = fiber.updateQueue;
                    if (updateQueue === null) ;
                    else {
                      var sharedQueue = updateQueue.shared;
                      var pending = sharedQueue.pending;
                      if (pending === null) {
                        update.next = update;
                      } else {
                        update.next = pending.next;
                        pending.next = update;
                      }
                      sharedQueue.pending = update;
                    }
                  }
                  fiber.lanes = mergeLanes(fiber.lanes, renderLanes2);
                  var alternate = fiber.alternate;
                  if (alternate !== null) {
                    alternate.lanes = mergeLanes(alternate.lanes, renderLanes2);
                  }
                  scheduleContextWorkOnParentPath(fiber.return, renderLanes2, workInProgress2);
                  list.lanes = mergeLanes(list.lanes, renderLanes2);
                  break;
                }
                dependency = dependency.next;
              }
            } else if (fiber.tag === ContextProvider) {
              nextFiber = fiber.type === workInProgress2.type ? null : fiber.child;
            } else if (fiber.tag === DehydratedFragment) {
              var parentSuspense = fiber.return;
              if (parentSuspense === null) {
                throw new Error("We just came from a parent so we must have had a parent. This is a bug in React.");
              }
              parentSuspense.lanes = mergeLanes(parentSuspense.lanes, renderLanes2);
              var _alternate = parentSuspense.alternate;
              if (_alternate !== null) {
                _alternate.lanes = mergeLanes(_alternate.lanes, renderLanes2);
              }
              scheduleContextWorkOnParentPath(parentSuspense, renderLanes2, workInProgress2);
              nextFiber = fiber.sibling;
            } else {
              nextFiber = fiber.child;
            }
            if (nextFiber !== null) {
              nextFiber.return = fiber;
            } else {
              nextFiber = fiber;
              while (nextFiber !== null) {
                if (nextFiber === workInProgress2) {
                  nextFiber = null;
                  break;
                }
                var sibling = nextFiber.sibling;
                if (sibling !== null) {
                  sibling.return = nextFiber.return;
                  nextFiber = sibling;
                  break;
                }
                nextFiber = nextFiber.return;
              }
            }
            fiber = nextFiber;
          }
        }
        function prepareToReadContext(workInProgress2, renderLanes2) {
          currentlyRenderingFiber = workInProgress2;
          lastContextDependency = null;
          lastFullyObservedContext = null;
          var dependencies = workInProgress2.dependencies;
          if (dependencies !== null) {
            {
              var firstContext = dependencies.firstContext;
              if (firstContext !== null) {
                if (includesSomeLane(dependencies.lanes, renderLanes2)) {
                  markWorkInProgressReceivedUpdate();
                }
                dependencies.firstContext = null;
              }
            }
          }
        }
        function readContext(context) {
          {
            if (isDisallowedContextReadInDEV) {
              error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
            }
          }
          var value = context._currentValue;
          if (lastFullyObservedContext === context) ;
          else {
            var contextItem = {
              context,
              memoizedValue: value,
              next: null
            };
            if (lastContextDependency === null) {
              if (currentlyRenderingFiber === null) {
                throw new Error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
              }
              lastContextDependency = contextItem;
              currentlyRenderingFiber.dependencies = {
                lanes: NoLanes,
                firstContext: contextItem
              };
            } else {
              lastContextDependency = lastContextDependency.next = contextItem;
            }
          }
          return value;
        }
        var concurrentQueues = null;
        function pushConcurrentUpdateQueue(queue) {
          if (concurrentQueues === null) {
            concurrentQueues = [queue];
          } else {
            concurrentQueues.push(queue);
          }
        }
        function finishQueueingConcurrentUpdates() {
          if (concurrentQueues !== null) {
            for (var i = 0; i < concurrentQueues.length; i++) {
              var queue = concurrentQueues[i];
              var lastInterleavedUpdate = queue.interleaved;
              if (lastInterleavedUpdate !== null) {
                queue.interleaved = null;
                var firstInterleavedUpdate = lastInterleavedUpdate.next;
                var lastPendingUpdate = queue.pending;
                if (lastPendingUpdate !== null) {
                  var firstPendingUpdate = lastPendingUpdate.next;
                  lastPendingUpdate.next = firstInterleavedUpdate;
                  lastInterleavedUpdate.next = firstPendingUpdate;
                }
                queue.pending = lastInterleavedUpdate;
              }
            }
            concurrentQueues = null;
          }
        }
        function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
          var interleaved = queue.interleaved;
          if (interleaved === null) {
            update.next = update;
            pushConcurrentUpdateQueue(queue);
          } else {
            update.next = interleaved.next;
            interleaved.next = update;
          }
          queue.interleaved = update;
          return markUpdateLaneFromFiberToRoot(fiber, lane);
        }
        function enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update, lane) {
          var interleaved = queue.interleaved;
          if (interleaved === null) {
            update.next = update;
            pushConcurrentUpdateQueue(queue);
          } else {
            update.next = interleaved.next;
            interleaved.next = update;
          }
          queue.interleaved = update;
        }
        function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
          var interleaved = queue.interleaved;
          if (interleaved === null) {
            update.next = update;
            pushConcurrentUpdateQueue(queue);
          } else {
            update.next = interleaved.next;
            interleaved.next = update;
          }
          queue.interleaved = update;
          return markUpdateLaneFromFiberToRoot(fiber, lane);
        }
        function enqueueConcurrentRenderForLane(fiber, lane) {
          return markUpdateLaneFromFiberToRoot(fiber, lane);
        }
        var unsafe_markUpdateLaneFromFiberToRoot = markUpdateLaneFromFiberToRoot;
        function markUpdateLaneFromFiberToRoot(sourceFiber, lane) {
          sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
          var alternate = sourceFiber.alternate;
          if (alternate !== null) {
            alternate.lanes = mergeLanes(alternate.lanes, lane);
          }
          {
            if (alternate === null && (sourceFiber.flags & (Placement | Hydrating)) !== NoFlags) {
              warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
            }
          }
          var node = sourceFiber;
          var parent = sourceFiber.return;
          while (parent !== null) {
            parent.childLanes = mergeLanes(parent.childLanes, lane);
            alternate = parent.alternate;
            if (alternate !== null) {
              alternate.childLanes = mergeLanes(alternate.childLanes, lane);
            } else {
              {
                if ((parent.flags & (Placement | Hydrating)) !== NoFlags) {
                  warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
                }
              }
            }
            node = parent;
            parent = parent.return;
          }
          if (node.tag === HostRoot) {
            var root2 = node.stateNode;
            return root2;
          } else {
            return null;
          }
        }
        var UpdateState = 0;
        var ReplaceState = 1;
        var ForceUpdate = 2;
        var CaptureUpdate = 3;
        var hasForceUpdate = false;
        var didWarnUpdateInsideUpdate;
        var currentlyProcessingQueue;
        {
          didWarnUpdateInsideUpdate = false;
          currentlyProcessingQueue = null;
        }
        function initializeUpdateQueue(fiber) {
          var queue = {
            baseState: fiber.memoizedState,
            firstBaseUpdate: null,
            lastBaseUpdate: null,
            shared: {
              pending: null,
              interleaved: null,
              lanes: NoLanes
            },
            effects: null
          };
          fiber.updateQueue = queue;
        }
        function cloneUpdateQueue(current2, workInProgress2) {
          var queue = workInProgress2.updateQueue;
          var currentQueue = current2.updateQueue;
          if (queue === currentQueue) {
            var clone = {
              baseState: currentQueue.baseState,
              firstBaseUpdate: currentQueue.firstBaseUpdate,
              lastBaseUpdate: currentQueue.lastBaseUpdate,
              shared: currentQueue.shared,
              effects: currentQueue.effects
            };
            workInProgress2.updateQueue = clone;
          }
        }
        function createUpdate(eventTime, lane) {
          var update = {
            eventTime,
            lane,
            tag: UpdateState,
            payload: null,
            callback: null,
            next: null
          };
          return update;
        }
        function enqueueUpdate(fiber, update, lane) {
          var updateQueue = fiber.updateQueue;
          if (updateQueue === null) {
            return null;
          }
          var sharedQueue = updateQueue.shared;
          {
            if (currentlyProcessingQueue === sharedQueue && !didWarnUpdateInsideUpdate) {
              error("An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function. Update functions should be pure, with zero side-effects. Consider using componentDidUpdate or a callback.");
              didWarnUpdateInsideUpdate = true;
            }
          }
          if (isUnsafeClassRenderPhaseUpdate()) {
            var pending = sharedQueue.pending;
            if (pending === null) {
              update.next = update;
            } else {
              update.next = pending.next;
              pending.next = update;
            }
            sharedQueue.pending = update;
            return unsafe_markUpdateLaneFromFiberToRoot(fiber, lane);
          } else {
            return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
          }
        }
        function entangleTransitions(root2, fiber, lane) {
          var updateQueue = fiber.updateQueue;
          if (updateQueue === null) {
            return;
          }
          var sharedQueue = updateQueue.shared;
          if (isTransitionLane(lane)) {
            var queueLanes = sharedQueue.lanes;
            queueLanes = intersectLanes(queueLanes, root2.pendingLanes);
            var newQueueLanes = mergeLanes(queueLanes, lane);
            sharedQueue.lanes = newQueueLanes;
            markRootEntangled(root2, newQueueLanes);
          }
        }
        function enqueueCapturedUpdate(workInProgress2, capturedUpdate) {
          var queue = workInProgress2.updateQueue;
          var current2 = workInProgress2.alternate;
          if (current2 !== null) {
            var currentQueue = current2.updateQueue;
            if (queue === currentQueue) {
              var newFirst = null;
              var newLast = null;
              var firstBaseUpdate = queue.firstBaseUpdate;
              if (firstBaseUpdate !== null) {
                var update = firstBaseUpdate;
                do {
                  var clone = {
                    eventTime: update.eventTime,
                    lane: update.lane,
                    tag: update.tag,
                    payload: update.payload,
                    callback: update.callback,
                    next: null
                  };
                  if (newLast === null) {
                    newFirst = newLast = clone;
                  } else {
                    newLast.next = clone;
                    newLast = clone;
                  }
                  update = update.next;
                } while (update !== null);
                if (newLast === null) {
                  newFirst = newLast = capturedUpdate;
                } else {
                  newLast.next = capturedUpdate;
                  newLast = capturedUpdate;
                }
              } else {
                newFirst = newLast = capturedUpdate;
              }
              queue = {
                baseState: currentQueue.baseState,
                firstBaseUpdate: newFirst,
                lastBaseUpdate: newLast,
                shared: currentQueue.shared,
                effects: currentQueue.effects
              };
              workInProgress2.updateQueue = queue;
              return;
            }
          }
          var lastBaseUpdate = queue.lastBaseUpdate;
          if (lastBaseUpdate === null) {
            queue.firstBaseUpdate = capturedUpdate;
          } else {
            lastBaseUpdate.next = capturedUpdate;
          }
          queue.lastBaseUpdate = capturedUpdate;
        }
        function getStateFromUpdate(workInProgress2, queue, update, prevState, nextProps, instance) {
          switch (update.tag) {
            case ReplaceState: {
              var payload = update.payload;
              if (typeof payload === "function") {
                {
                  enterDisallowedContextReadInDEV();
                }
                var nextState = payload.call(instance, prevState, nextProps);
                {
                  if (workInProgress2.mode & StrictLegacyMode) {
                    setIsStrictModeForDevtools(true);
                    try {
                      payload.call(instance, prevState, nextProps);
                    } finally {
                      setIsStrictModeForDevtools(false);
                    }
                  }
                  exitDisallowedContextReadInDEV();
                }
                return nextState;
              }
              return payload;
            }
            case CaptureUpdate: {
              workInProgress2.flags = workInProgress2.flags & ~ShouldCapture | DidCapture;
            }
            case UpdateState: {
              var _payload = update.payload;
              var partialState;
              if (typeof _payload === "function") {
                {
                  enterDisallowedContextReadInDEV();
                }
                partialState = _payload.call(instance, prevState, nextProps);
                {
                  if (workInProgress2.mode & StrictLegacyMode) {
                    setIsStrictModeForDevtools(true);
                    try {
                      _payload.call(instance, prevState, nextProps);
                    } finally {
                      setIsStrictModeForDevtools(false);
                    }
                  }
                  exitDisallowedContextReadInDEV();
                }
              } else {
                partialState = _payload;
              }
              if (partialState === null || partialState === void 0) {
                return prevState;
              }
              return assign({}, prevState, partialState);
            }
            case ForceUpdate: {
              hasForceUpdate = true;
              return prevState;
            }
          }
          return prevState;
        }
        function processUpdateQueue(workInProgress2, props, instance, renderLanes2) {
          var queue = workInProgress2.updateQueue;
          hasForceUpdate = false;
          {
            currentlyProcessingQueue = queue.shared;
          }
          var firstBaseUpdate = queue.firstBaseUpdate;
          var lastBaseUpdate = queue.lastBaseUpdate;
          var pendingQueue = queue.shared.pending;
          if (pendingQueue !== null) {
            queue.shared.pending = null;
            var lastPendingUpdate = pendingQueue;
            var firstPendingUpdate = lastPendingUpdate.next;
            lastPendingUpdate.next = null;
            if (lastBaseUpdate === null) {
              firstBaseUpdate = firstPendingUpdate;
            } else {
              lastBaseUpdate.next = firstPendingUpdate;
            }
            lastBaseUpdate = lastPendingUpdate;
            var current2 = workInProgress2.alternate;
            if (current2 !== null) {
              var currentQueue = current2.updateQueue;
              var currentLastBaseUpdate = currentQueue.lastBaseUpdate;
              if (currentLastBaseUpdate !== lastBaseUpdate) {
                if (currentLastBaseUpdate === null) {
                  currentQueue.firstBaseUpdate = firstPendingUpdate;
                } else {
                  currentLastBaseUpdate.next = firstPendingUpdate;
                }
                currentQueue.lastBaseUpdate = lastPendingUpdate;
              }
            }
          }
          if (firstBaseUpdate !== null) {
            var newState = queue.baseState;
            var newLanes = NoLanes;
            var newBaseState = null;
            var newFirstBaseUpdate = null;
            var newLastBaseUpdate = null;
            var update = firstBaseUpdate;
            do {
              var updateLane = update.lane;
              var updateEventTime = update.eventTime;
              if (!isSubsetOfLanes(renderLanes2, updateLane)) {
                var clone = {
                  eventTime: updateEventTime,
                  lane: updateLane,
                  tag: update.tag,
                  payload: update.payload,
                  callback: update.callback,
                  next: null
                };
                if (newLastBaseUpdate === null) {
                  newFirstBaseUpdate = newLastBaseUpdate = clone;
                  newBaseState = newState;
                } else {
                  newLastBaseUpdate = newLastBaseUpdate.next = clone;
                }
                newLanes = mergeLanes(newLanes, updateLane);
              } else {
                if (newLastBaseUpdate !== null) {
                  var _clone = {
                    eventTime: updateEventTime,
                    // This update is going to be committed so we never want uncommit
                    // it. Using NoLane works because 0 is a subset of all bitmasks, so
                    // this will never be skipped by the check above.
                    lane: NoLane,
                    tag: update.tag,
                    payload: update.payload,
                    callback: update.callback,
                    next: null
                  };
                  newLastBaseUpdate = newLastBaseUpdate.next = _clone;
                }
                newState = getStateFromUpdate(workInProgress2, queue, update, newState, props, instance);
                var callback = update.callback;
                if (callback !== null && // If the update was already committed, we should not queue its
                // callback again.
                update.lane !== NoLane) {
                  workInProgress2.flags |= Callback;
                  var effects = queue.effects;
                  if (effects === null) {
                    queue.effects = [update];
                  } else {
                    effects.push(update);
                  }
                }
              }
              update = update.next;
              if (update === null) {
                pendingQueue = queue.shared.pending;
                if (pendingQueue === null) {
                  break;
                } else {
                  var _lastPendingUpdate = pendingQueue;
                  var _firstPendingUpdate = _lastPendingUpdate.next;
                  _lastPendingUpdate.next = null;
                  update = _firstPendingUpdate;
                  queue.lastBaseUpdate = _lastPendingUpdate;
                  queue.shared.pending = null;
                }
              }
            } while (true);
            if (newLastBaseUpdate === null) {
              newBaseState = newState;
            }
            queue.baseState = newBaseState;
            queue.firstBaseUpdate = newFirstBaseUpdate;
            queue.lastBaseUpdate = newLastBaseUpdate;
            var lastInterleaved = queue.shared.interleaved;
            if (lastInterleaved !== null) {
              var interleaved = lastInterleaved;
              do {
                newLanes = mergeLanes(newLanes, interleaved.lane);
                interleaved = interleaved.next;
              } while (interleaved !== lastInterleaved);
            } else if (firstBaseUpdate === null) {
              queue.shared.lanes = NoLanes;
            }
            markSkippedUpdateLanes(newLanes);
            workInProgress2.lanes = newLanes;
            workInProgress2.memoizedState = newState;
          }
          {
            currentlyProcessingQueue = null;
          }
        }
        function callCallback(callback, context) {
          if (typeof callback !== "function") {
            throw new Error("Invalid argument passed as callback. Expected a function. Instead " + ("received: " + callback));
          }
          callback.call(context);
        }
        function resetHasForceUpdateBeforeProcessing() {
          hasForceUpdate = false;
        }
        function checkHasForceUpdateAfterProcessing() {
          return hasForceUpdate;
        }
        function commitUpdateQueue(finishedWork, finishedQueue, instance) {
          var effects = finishedQueue.effects;
          finishedQueue.effects = null;
          if (effects !== null) {
            for (var i = 0; i < effects.length; i++) {
              var effect = effects[i];
              var callback = effect.callback;
              if (callback !== null) {
                effect.callback = null;
                callCallback(callback, instance);
              }
            }
          }
        }
        var NO_CONTEXT = {};
        var contextStackCursor$1 = createCursor(NO_CONTEXT);
        var contextFiberStackCursor = createCursor(NO_CONTEXT);
        var rootInstanceStackCursor = createCursor(NO_CONTEXT);
        function requiredContext(c) {
          if (c === NO_CONTEXT) {
            throw new Error("Expected host context to exist. This error is likely caused by a bug in React. Please file an issue.");
          }
          return c;
        }
        function getRootHostContainer() {
          var rootInstance = requiredContext(rootInstanceStackCursor.current);
          return rootInstance;
        }
        function pushHostContainer(fiber, nextRootInstance) {
          push(rootInstanceStackCursor, nextRootInstance, fiber);
          push(contextFiberStackCursor, fiber, fiber);
          push(contextStackCursor$1, NO_CONTEXT, fiber);
          var nextRootContext = getRootHostContext(nextRootInstance);
          pop(contextStackCursor$1, fiber);
          push(contextStackCursor$1, nextRootContext, fiber);
        }
        function popHostContainer(fiber) {
          pop(contextStackCursor$1, fiber);
          pop(contextFiberStackCursor, fiber);
          pop(rootInstanceStackCursor, fiber);
        }
        function getHostContext() {
          var context = requiredContext(contextStackCursor$1.current);
          return context;
        }
        function pushHostContext(fiber) {
          var rootInstance = requiredContext(rootInstanceStackCursor.current);
          var context = requiredContext(contextStackCursor$1.current);
          var nextContext = getChildHostContext(context, fiber.type);
          if (context === nextContext) {
            return;
          }
          push(contextFiberStackCursor, fiber, fiber);
          push(contextStackCursor$1, nextContext, fiber);
        }
        function popHostContext(fiber) {
          if (contextFiberStackCursor.current !== fiber) {
            return;
          }
          pop(contextStackCursor$1, fiber);
          pop(contextFiberStackCursor, fiber);
        }
        var DefaultSuspenseContext = 0;
        var SubtreeSuspenseContextMask = 1;
        var InvisibleParentSuspenseContext = 1;
        var ForceSuspenseFallback = 2;
        var suspenseStackCursor = createCursor(DefaultSuspenseContext);
        function hasSuspenseContext(parentContext, flag) {
          return (parentContext & flag) !== 0;
        }
        function setDefaultShallowSuspenseContext(parentContext) {
          return parentContext & SubtreeSuspenseContextMask;
        }
        function setShallowSuspenseContext(parentContext, shallowContext) {
          return parentContext & SubtreeSuspenseContextMask | shallowContext;
        }
        function addSubtreeSuspenseContext(parentContext, subtreeContext) {
          return parentContext | subtreeContext;
        }
        function pushSuspenseContext(fiber, newContext) {
          push(suspenseStackCursor, newContext, fiber);
        }
        function popSuspenseContext(fiber) {
          pop(suspenseStackCursor, fiber);
        }
        function shouldCaptureSuspense(workInProgress2, hasInvisibleParent) {
          var nextState = workInProgress2.memoizedState;
          if (nextState !== null) {
            if (nextState.dehydrated !== null) {
              return true;
            }
            return false;
          }
          var props = workInProgress2.memoizedProps;
          {
            return true;
          }
        }
        function findFirstSuspended(row) {
          var node = row;
          while (node !== null) {
            if (node.tag === SuspenseComponent) {
              var state = node.memoizedState;
              if (state !== null) {
                var dehydrated = state.dehydrated;
                if (dehydrated === null || isSuspenseInstancePending(dehydrated) || isSuspenseInstanceFallback(dehydrated)) {
                  return node;
                }
              }
            } else if (node.tag === SuspenseListComponent && // revealOrder undefined can't be trusted because it don't
            // keep track of whether it suspended or not.
            node.memoizedProps.revealOrder !== void 0) {
              var didSuspend = (node.flags & DidCapture) !== NoFlags;
              if (didSuspend) {
                return node;
              }
            } else if (node.child !== null) {
              node.child.return = node;
              node = node.child;
              continue;
            }
            if (node === row) {
              return null;
            }
            while (node.sibling === null) {
              if (node.return === null || node.return === row) {
                return null;
              }
              node = node.return;
            }
            node.sibling.return = node.return;
            node = node.sibling;
          }
          return null;
        }
        var NoFlags$1 = (
          /*   */
          0
        );
        var HasEffect = (
          /* */
          1
        );
        var Insertion = (
          /*  */
          2
        );
        var Layout = (
          /*    */
          4
        );
        var Passive$1 = (
          /*   */
          8
        );
        var workInProgressSources = [];
        function resetWorkInProgressVersions() {
          for (var i = 0; i < workInProgressSources.length; i++) {
            var mutableSource = workInProgressSources[i];
            {
              mutableSource._workInProgressVersionPrimary = null;
            }
          }
          workInProgressSources.length = 0;
        }
        function registerMutableSourceForHydration(root2, mutableSource) {
          var getVersion = mutableSource._getVersion;
          var version = getVersion(mutableSource._source);
          if (root2.mutableSourceEagerHydrationData == null) {
            root2.mutableSourceEagerHydrationData = [mutableSource, version];
          } else {
            root2.mutableSourceEagerHydrationData.push(mutableSource, version);
          }
        }
        var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher, ReactCurrentBatchConfig$2 = ReactSharedInternals.ReactCurrentBatchConfig;
        var didWarnAboutMismatchedHooksForComponent;
        var didWarnUncachedGetSnapshot;
        {
          didWarnAboutMismatchedHooksForComponent = /* @__PURE__ */ new Set();
        }
        var renderLanes = NoLanes;
        var currentlyRenderingFiber$1 = null;
        var currentHook = null;
        var workInProgressHook = null;
        var didScheduleRenderPhaseUpdate = false;
        var didScheduleRenderPhaseUpdateDuringThisPass = false;
        var localIdCounter = 0;
        var globalClientIdCounter = 0;
        var RE_RENDER_LIMIT = 25;
        var currentHookNameInDev = null;
        var hookTypesDev = null;
        var hookTypesUpdateIndexDev = -1;
        var ignorePreviousDependencies = false;
        function mountHookTypesDev() {
          {
            var hookName = currentHookNameInDev;
            if (hookTypesDev === null) {
              hookTypesDev = [hookName];
            } else {
              hookTypesDev.push(hookName);
            }
          }
        }
        function updateHookTypesDev() {
          {
            var hookName = currentHookNameInDev;
            if (hookTypesDev !== null) {
              hookTypesUpdateIndexDev++;
              if (hookTypesDev[hookTypesUpdateIndexDev] !== hookName) {
                warnOnHookMismatchInDev(hookName);
              }
            }
          }
        }
        function checkDepsAreArrayDev(deps) {
          {
            if (deps !== void 0 && deps !== null && !isArray(deps)) {
              error("%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.", currentHookNameInDev, typeof deps);
            }
          }
        }
        function warnOnHookMismatchInDev(currentHookName) {
          {
            var componentName = getComponentNameFromFiber(currentlyRenderingFiber$1);
            if (!didWarnAboutMismatchedHooksForComponent.has(componentName)) {
              didWarnAboutMismatchedHooksForComponent.add(componentName);
              if (hookTypesDev !== null) {
                var table = "";
                var secondColumnStart = 30;
                for (var i = 0; i <= hookTypesUpdateIndexDev; i++) {
                  var oldHookName = hookTypesDev[i];
                  var newHookName = i === hookTypesUpdateIndexDev ? currentHookName : oldHookName;
                  var row = i + 1 + ". " + oldHookName;
                  while (row.length < secondColumnStart) {
                    row += " ";
                  }
                  row += newHookName + "\n";
                  table += row;
                }
                error("React has detected a change in the order of Hooks called by %s. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks\n\n   Previous render            Next render\n   ------------------------------------------------------\n%s   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n", componentName, table);
              }
            }
          }
        }
        function throwInvalidHookError() {
          throw new Error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
        }
        function areHookInputsEqual(nextDeps, prevDeps) {
          {
            if (ignorePreviousDependencies) {
              return false;
            }
          }
          if (prevDeps === null) {
            {
              error("%s received a final argument during this render, but not during the previous render. Even though the final argument is optional, its type cannot change between renders.", currentHookNameInDev);
            }
            return false;
          }
          {
            if (nextDeps.length !== prevDeps.length) {
              error("The final argument passed to %s changed size between renders. The order and size of this array must remain constant.\n\nPrevious: %s\nIncoming: %s", currentHookNameInDev, "[" + prevDeps.join(", ") + "]", "[" + nextDeps.join(", ") + "]");
            }
          }
          for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
            if (objectIs(nextDeps[i], prevDeps[i])) {
              continue;
            }
            return false;
          }
          return true;
        }
        function renderWithHooks(current2, workInProgress2, Component, props, secondArg, nextRenderLanes) {
          renderLanes = nextRenderLanes;
          currentlyRenderingFiber$1 = workInProgress2;
          {
            hookTypesDev = current2 !== null ? current2._debugHookTypes : null;
            hookTypesUpdateIndexDev = -1;
            ignorePreviousDependencies = current2 !== null && current2.type !== workInProgress2.type;
          }
          workInProgress2.memoizedState = null;
          workInProgress2.updateQueue = null;
          workInProgress2.lanes = NoLanes;
          {
            if (current2 !== null && current2.memoizedState !== null) {
              ReactCurrentDispatcher$1.current = HooksDispatcherOnUpdateInDEV;
            } else if (hookTypesDev !== null) {
              ReactCurrentDispatcher$1.current = HooksDispatcherOnMountWithHookTypesInDEV;
            } else {
              ReactCurrentDispatcher$1.current = HooksDispatcherOnMountInDEV;
            }
          }
          var children = Component(props, secondArg);
          if (didScheduleRenderPhaseUpdateDuringThisPass) {
            var numberOfReRenders = 0;
            do {
              didScheduleRenderPhaseUpdateDuringThisPass = false;
              localIdCounter = 0;
              if (numberOfReRenders >= RE_RENDER_LIMIT) {
                throw new Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
              }
              numberOfReRenders += 1;
              {
                ignorePreviousDependencies = false;
              }
              currentHook = null;
              workInProgressHook = null;
              workInProgress2.updateQueue = null;
              {
                hookTypesUpdateIndexDev = -1;
              }
              ReactCurrentDispatcher$1.current = HooksDispatcherOnRerenderInDEV;
              children = Component(props, secondArg);
            } while (didScheduleRenderPhaseUpdateDuringThisPass);
          }
          ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
          {
            workInProgress2._debugHookTypes = hookTypesDev;
          }
          var didRenderTooFewHooks = currentHook !== null && currentHook.next !== null;
          renderLanes = NoLanes;
          currentlyRenderingFiber$1 = null;
          currentHook = null;
          workInProgressHook = null;
          {
            currentHookNameInDev = null;
            hookTypesDev = null;
            hookTypesUpdateIndexDev = -1;
            if (current2 !== null && (current2.flags & StaticMask) !== (workInProgress2.flags & StaticMask) && // Disable this warning in legacy mode, because legacy Suspense is weird
            // and creates false positives. To make this work in legacy mode, we'd
            // need to mark fibers that commit in an incomplete state, somehow. For
            // now I'll disable the warning that most of the bugs that would trigger
            // it are either exclusive to concurrent mode or exist in both.
            (current2.mode & ConcurrentMode) !== NoMode) {
              error("Internal React error: Expected static flag was missing. Please notify the React team.");
            }
          }
          didScheduleRenderPhaseUpdate = false;
          if (didRenderTooFewHooks) {
            throw new Error("Rendered fewer hooks than expected. This may be caused by an accidental early return statement.");
          }
          return children;
        }
        function checkDidRenderIdHook() {
          var didRenderIdHook = localIdCounter !== 0;
          localIdCounter = 0;
          return didRenderIdHook;
        }
        function bailoutHooks(current2, workInProgress2, lanes) {
          workInProgress2.updateQueue = current2.updateQueue;
          if ((workInProgress2.mode & StrictEffectsMode) !== NoMode) {
            workInProgress2.flags &= ~(MountPassiveDev | MountLayoutDev | Passive | Update);
          } else {
            workInProgress2.flags &= ~(Passive | Update);
          }
          current2.lanes = removeLanes(current2.lanes, lanes);
        }
        function resetHooksAfterThrow() {
          ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
          if (didScheduleRenderPhaseUpdate) {
            var hook = currentlyRenderingFiber$1.memoizedState;
            while (hook !== null) {
              var queue = hook.queue;
              if (queue !== null) {
                queue.pending = null;
              }
              hook = hook.next;
            }
            didScheduleRenderPhaseUpdate = false;
          }
          renderLanes = NoLanes;
          currentlyRenderingFiber$1 = null;
          currentHook = null;
          workInProgressHook = null;
          {
            hookTypesDev = null;
            hookTypesUpdateIndexDev = -1;
            currentHookNameInDev = null;
            isUpdatingOpaqueValueInRenderPhase = false;
          }
          didScheduleRenderPhaseUpdateDuringThisPass = false;
          localIdCounter = 0;
        }
        function mountWorkInProgressHook() {
          var hook = {
            memoizedState: null,
            baseState: null,
            baseQueue: null,
            queue: null,
            next: null
          };
          if (workInProgressHook === null) {
            currentlyRenderingFiber$1.memoizedState = workInProgressHook = hook;
          } else {
            workInProgressHook = workInProgressHook.next = hook;
          }
          return workInProgressHook;
        }
        function updateWorkInProgressHook() {
          var nextCurrentHook;
          if (currentHook === null) {
            var current2 = currentlyRenderingFiber$1.alternate;
            if (current2 !== null) {
              nextCurrentHook = current2.memoizedState;
            } else {
              nextCurrentHook = null;
            }
          } else {
            nextCurrentHook = currentHook.next;
          }
          var nextWorkInProgressHook;
          if (workInProgressHook === null) {
            nextWorkInProgressHook = currentlyRenderingFiber$1.memoizedState;
          } else {
            nextWorkInProgressHook = workInProgressHook.next;
          }
          if (nextWorkInProgressHook !== null) {
            workInProgressHook = nextWorkInProgressHook;
            nextWorkInProgressHook = workInProgressHook.next;
            currentHook = nextCurrentHook;
          } else {
            if (nextCurrentHook === null) {
              throw new Error("Rendered more hooks than during the previous render.");
            }
            currentHook = nextCurrentHook;
            var newHook = {
              memoizedState: currentHook.memoizedState,
              baseState: currentHook.baseState,
              baseQueue: currentHook.baseQueue,
              queue: currentHook.queue,
              next: null
            };
            if (workInProgressHook === null) {
              currentlyRenderingFiber$1.memoizedState = workInProgressHook = newHook;
            } else {
              workInProgressHook = workInProgressHook.next = newHook;
            }
          }
          return workInProgressHook;
        }
        function createFunctionComponentUpdateQueue() {
          return {
            lastEffect: null,
            stores: null
          };
        }
        function basicStateReducer(state, action) {
          return typeof action === "function" ? action(state) : action;
        }
        function mountReducer(reducer, initialArg, init) {
          var hook = mountWorkInProgressHook();
          var initialState;
          if (init !== void 0) {
            initialState = init(initialArg);
          } else {
            initialState = initialArg;
          }
          hook.memoizedState = hook.baseState = initialState;
          var queue = {
            pending: null,
            interleaved: null,
            lanes: NoLanes,
            dispatch: null,
            lastRenderedReducer: reducer,
            lastRenderedState: initialState
          };
          hook.queue = queue;
          var dispatch = queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber$1, queue);
          return [hook.memoizedState, dispatch];
        }
        function updateReducer(reducer, initialArg, init) {
          var hook = updateWorkInProgressHook();
          var queue = hook.queue;
          if (queue === null) {
            throw new Error("Should have a queue. This is likely a bug in React. Please file an issue.");
          }
          queue.lastRenderedReducer = reducer;
          var current2 = currentHook;
          var baseQueue = current2.baseQueue;
          var pendingQueue = queue.pending;
          if (pendingQueue !== null) {
            if (baseQueue !== null) {
              var baseFirst = baseQueue.next;
              var pendingFirst = pendingQueue.next;
              baseQueue.next = pendingFirst;
              pendingQueue.next = baseFirst;
            }
            {
              if (current2.baseQueue !== baseQueue) {
                error("Internal error: Expected work-in-progress queue to be a clone. This is a bug in React.");
              }
            }
            current2.baseQueue = baseQueue = pendingQueue;
            queue.pending = null;
          }
          if (baseQueue !== null) {
            var first = baseQueue.next;
            var newState = current2.baseState;
            var newBaseState = null;
            var newBaseQueueFirst = null;
            var newBaseQueueLast = null;
            var update = first;
            do {
              var updateLane = update.lane;
              if (!isSubsetOfLanes(renderLanes, updateLane)) {
                var clone = {
                  lane: updateLane,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                };
                if (newBaseQueueLast === null) {
                  newBaseQueueFirst = newBaseQueueLast = clone;
                  newBaseState = newState;
                } else {
                  newBaseQueueLast = newBaseQueueLast.next = clone;
                }
                currentlyRenderingFiber$1.lanes = mergeLanes(currentlyRenderingFiber$1.lanes, updateLane);
                markSkippedUpdateLanes(updateLane);
              } else {
                if (newBaseQueueLast !== null) {
                  var _clone = {
                    // This update is going to be committed so we never want uncommit
                    // it. Using NoLane works because 0 is a subset of all bitmasks, so
                    // this will never be skipped by the check above.
                    lane: NoLane,
                    action: update.action,
                    hasEagerState: update.hasEagerState,
                    eagerState: update.eagerState,
                    next: null
                  };
                  newBaseQueueLast = newBaseQueueLast.next = _clone;
                }
                if (update.hasEagerState) {
                  newState = update.eagerState;
                } else {
                  var action = update.action;
                  newState = reducer(newState, action);
                }
              }
              update = update.next;
            } while (update !== null && update !== first);
            if (newBaseQueueLast === null) {
              newBaseState = newState;
            } else {
              newBaseQueueLast.next = newBaseQueueFirst;
            }
            if (!objectIs(newState, hook.memoizedState)) {
              markWorkInProgressReceivedUpdate();
            }
            hook.memoizedState = newState;
            hook.baseState = newBaseState;
            hook.baseQueue = newBaseQueueLast;
            queue.lastRenderedState = newState;
          }
          var lastInterleaved = queue.interleaved;
          if (lastInterleaved !== null) {
            var interleaved = lastInterleaved;
            do {
              var interleavedLane = interleaved.lane;
              currentlyRenderingFiber$1.lanes = mergeLanes(currentlyRenderingFiber$1.lanes, interleavedLane);
              markSkippedUpdateLanes(interleavedLane);
              interleaved = interleaved.next;
            } while (interleaved !== lastInterleaved);
          } else if (baseQueue === null) {
            queue.lanes = NoLanes;
          }
          var dispatch = queue.dispatch;
          return [hook.memoizedState, dispatch];
        }
        function rerenderReducer(reducer, initialArg, init) {
          var hook = updateWorkInProgressHook();
          var queue = hook.queue;
          if (queue === null) {
            throw new Error("Should have a queue. This is likely a bug in React. Please file an issue.");
          }
          queue.lastRenderedReducer = reducer;
          var dispatch = queue.dispatch;
          var lastRenderPhaseUpdate = queue.pending;
          var newState = hook.memoizedState;
          if (lastRenderPhaseUpdate !== null) {
            queue.pending = null;
            var firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
            var update = firstRenderPhaseUpdate;
            do {
              var action = update.action;
              newState = reducer(newState, action);
              update = update.next;
            } while (update !== firstRenderPhaseUpdate);
            if (!objectIs(newState, hook.memoizedState)) {
              markWorkInProgressReceivedUpdate();
            }
            hook.memoizedState = newState;
            if (hook.baseQueue === null) {
              hook.baseState = newState;
            }
            queue.lastRenderedState = newState;
          }
          return [newState, dispatch];
        }
        function mountMutableSource(source, getSnapshot, subscribe) {
          {
            return void 0;
          }
        }
        function updateMutableSource(source, getSnapshot, subscribe) {
          {
            return void 0;
          }
        }
        function mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          var fiber = currentlyRenderingFiber$1;
          var hook = mountWorkInProgressHook();
          var nextSnapshot;
          var isHydrating2 = getIsHydrating();
          if (isHydrating2) {
            if (getServerSnapshot === void 0) {
              throw new Error("Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering.");
            }
            nextSnapshot = getServerSnapshot();
            {
              if (!didWarnUncachedGetSnapshot) {
                if (nextSnapshot !== getServerSnapshot()) {
                  error("The result of getServerSnapshot should be cached to avoid an infinite loop");
                  didWarnUncachedGetSnapshot = true;
                }
              }
            }
          } else {
            nextSnapshot = getSnapshot();
            {
              if (!didWarnUncachedGetSnapshot) {
                var cachedSnapshot = getSnapshot();
                if (!objectIs(nextSnapshot, cachedSnapshot)) {
                  error("The result of getSnapshot should be cached to avoid an infinite loop");
                  didWarnUncachedGetSnapshot = true;
                }
              }
            }
            var root2 = getWorkInProgressRoot();
            if (root2 === null) {
              throw new Error("Expected a work-in-progress root. This is a bug in React. Please file an issue.");
            }
            if (!includesBlockingLane(root2, renderLanes)) {
              pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
            }
          }
          hook.memoizedState = nextSnapshot;
          var inst = {
            value: nextSnapshot,
            getSnapshot
          };
          hook.queue = inst;
          mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]);
          fiber.flags |= Passive;
          pushEffect(HasEffect | Passive$1, updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot), void 0, null);
          return nextSnapshot;
        }
        function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          var fiber = currentlyRenderingFiber$1;
          var hook = updateWorkInProgressHook();
          var nextSnapshot = getSnapshot();
          {
            if (!didWarnUncachedGetSnapshot) {
              var cachedSnapshot = getSnapshot();
              if (!objectIs(nextSnapshot, cachedSnapshot)) {
                error("The result of getSnapshot should be cached to avoid an infinite loop");
                didWarnUncachedGetSnapshot = true;
              }
            }
          }
          var prevSnapshot = hook.memoizedState;
          var snapshotChanged = !objectIs(prevSnapshot, nextSnapshot);
          if (snapshotChanged) {
            hook.memoizedState = nextSnapshot;
            markWorkInProgressReceivedUpdate();
          }
          var inst = hook.queue;
          updateEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]);
          if (inst.getSnapshot !== getSnapshot || snapshotChanged || // Check if the susbcribe function changed. We can save some memory by
          // checking whether we scheduled a subscription effect above.
          workInProgressHook !== null && workInProgressHook.memoizedState.tag & HasEffect) {
            fiber.flags |= Passive;
            pushEffect(HasEffect | Passive$1, updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot), void 0, null);
            var root2 = getWorkInProgressRoot();
            if (root2 === null) {
              throw new Error("Expected a work-in-progress root. This is a bug in React. Please file an issue.");
            }
            if (!includesBlockingLane(root2, renderLanes)) {
              pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
            }
          }
          return nextSnapshot;
        }
        function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
          fiber.flags |= StoreConsistency;
          var check = {
            getSnapshot,
            value: renderedSnapshot
          };
          var componentUpdateQueue = currentlyRenderingFiber$1.updateQueue;
          if (componentUpdateQueue === null) {
            componentUpdateQueue = createFunctionComponentUpdateQueue();
            currentlyRenderingFiber$1.updateQueue = componentUpdateQueue;
            componentUpdateQueue.stores = [check];
          } else {
            var stores = componentUpdateQueue.stores;
            if (stores === null) {
              componentUpdateQueue.stores = [check];
            } else {
              stores.push(check);
            }
          }
        }
        function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
          inst.value = nextSnapshot;
          inst.getSnapshot = getSnapshot;
          if (checkIfSnapshotChanged(inst)) {
            forceStoreRerender(fiber);
          }
        }
        function subscribeToStore(fiber, inst, subscribe) {
          var handleStoreChange = function() {
            if (checkIfSnapshotChanged(inst)) {
              forceStoreRerender(fiber);
            }
          };
          return subscribe(handleStoreChange);
        }
        function checkIfSnapshotChanged(inst) {
          var latestGetSnapshot = inst.getSnapshot;
          var prevValue = inst.value;
          try {
            var nextValue = latestGetSnapshot();
            return !objectIs(prevValue, nextValue);
          } catch (error2) {
            return true;
          }
        }
        function forceStoreRerender(fiber) {
          var root2 = enqueueConcurrentRenderForLane(fiber, SyncLane);
          if (root2 !== null) {
            scheduleUpdateOnFiber(root2, fiber, SyncLane, NoTimestamp);
          }
        }
        function mountState(initialState) {
          var hook = mountWorkInProgressHook();
          if (typeof initialState === "function") {
            initialState = initialState();
          }
          hook.memoizedState = hook.baseState = initialState;
          var queue = {
            pending: null,
            interleaved: null,
            lanes: NoLanes,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: initialState
          };
          hook.queue = queue;
          var dispatch = queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber$1, queue);
          return [hook.memoizedState, dispatch];
        }
        function updateState(initialState) {
          return updateReducer(basicStateReducer);
        }
        function rerenderState(initialState) {
          return rerenderReducer(basicStateReducer);
        }
        function pushEffect(tag, create, destroy, deps) {
          var effect = {
            tag,
            create,
            destroy,
            deps,
            // Circular
            next: null
          };
          var componentUpdateQueue = currentlyRenderingFiber$1.updateQueue;
          if (componentUpdateQueue === null) {
            componentUpdateQueue = createFunctionComponentUpdateQueue();
            currentlyRenderingFiber$1.updateQueue = componentUpdateQueue;
            componentUpdateQueue.lastEffect = effect.next = effect;
          } else {
            var lastEffect = componentUpdateQueue.lastEffect;
            if (lastEffect === null) {
              componentUpdateQueue.lastEffect = effect.next = effect;
            } else {
              var firstEffect = lastEffect.next;
              lastEffect.next = effect;
              effect.next = firstEffect;
              componentUpdateQueue.lastEffect = effect;
            }
          }
          return effect;
        }
        function mountRef(initialValue) {
          var hook = mountWorkInProgressHook();
          {
            var _ref2 = {
              current: initialValue
            };
            hook.memoizedState = _ref2;
            return _ref2;
          }
        }
        function updateRef(initialValue) {
          var hook = updateWorkInProgressHook();
          return hook.memoizedState;
        }
        function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
          var hook = mountWorkInProgressHook();
          var nextDeps = deps === void 0 ? null : deps;
          currentlyRenderingFiber$1.flags |= fiberFlags;
          hook.memoizedState = pushEffect(HasEffect | hookFlags, create, void 0, nextDeps);
        }
        function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
          var hook = updateWorkInProgressHook();
          var nextDeps = deps === void 0 ? null : deps;
          var destroy = void 0;
          if (currentHook !== null) {
            var prevEffect = currentHook.memoizedState;
            destroy = prevEffect.destroy;
            if (nextDeps !== null) {
              var prevDeps = prevEffect.deps;
              if (areHookInputsEqual(nextDeps, prevDeps)) {
                hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
                return;
              }
            }
          }
          currentlyRenderingFiber$1.flags |= fiberFlags;
          hook.memoizedState = pushEffect(HasEffect | hookFlags, create, destroy, nextDeps);
        }
        function mountEffect(create, deps) {
          if ((currentlyRenderingFiber$1.mode & StrictEffectsMode) !== NoMode) {
            return mountEffectImpl(MountPassiveDev | Passive | PassiveStatic, Passive$1, create, deps);
          } else {
            return mountEffectImpl(Passive | PassiveStatic, Passive$1, create, deps);
          }
        }
        function updateEffect(create, deps) {
          return updateEffectImpl(Passive, Passive$1, create, deps);
        }
        function mountInsertionEffect(create, deps) {
          return mountEffectImpl(Update, Insertion, create, deps);
        }
        function updateInsertionEffect(create, deps) {
          return updateEffectImpl(Update, Insertion, create, deps);
        }
        function mountLayoutEffect(create, deps) {
          var fiberFlags = Update;
          {
            fiberFlags |= LayoutStatic;
          }
          if ((currentlyRenderingFiber$1.mode & StrictEffectsMode) !== NoMode) {
            fiberFlags |= MountLayoutDev;
          }
          return mountEffectImpl(fiberFlags, Layout, create, deps);
        }
        function updateLayoutEffect(create, deps) {
          return updateEffectImpl(Update, Layout, create, deps);
        }
        function imperativeHandleEffect(create, ref) {
          if (typeof ref === "function") {
            var refCallback = ref;
            var _inst = create();
            refCallback(_inst);
            return function() {
              refCallback(null);
            };
          } else if (ref !== null && ref !== void 0) {
            var refObject = ref;
            {
              if (!refObject.hasOwnProperty("current")) {
                error("Expected useImperativeHandle() first argument to either be a ref callback or React.createRef() object. Instead received: %s.", "an object with keys {" + Object.keys(refObject).join(", ") + "}");
              }
            }
            var _inst2 = create();
            refObject.current = _inst2;
            return function() {
              refObject.current = null;
            };
          }
        }
        function mountImperativeHandle(ref, create, deps) {
          {
            if (typeof create !== "function") {
              error("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", create !== null ? typeof create : "null");
            }
          }
          var effectDeps = deps !== null && deps !== void 0 ? deps.concat([ref]) : null;
          var fiberFlags = Update;
          {
            fiberFlags |= LayoutStatic;
          }
          if ((currentlyRenderingFiber$1.mode & StrictEffectsMode) !== NoMode) {
            fiberFlags |= MountLayoutDev;
          }
          return mountEffectImpl(fiberFlags, Layout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
        }
        function updateImperativeHandle(ref, create, deps) {
          {
            if (typeof create !== "function") {
              error("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", create !== null ? typeof create : "null");
            }
          }
          var effectDeps = deps !== null && deps !== void 0 ? deps.concat([ref]) : null;
          return updateEffectImpl(Update, Layout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
        }
        function mountDebugValue(value, formatterFn) {
        }
        var updateDebugValue = mountDebugValue;
        function mountCallback(callback, deps) {
          var hook = mountWorkInProgressHook();
          var nextDeps = deps === void 0 ? null : deps;
          hook.memoizedState = [callback, nextDeps];
          return callback;
        }
        function updateCallback(callback, deps) {
          var hook = updateWorkInProgressHook();
          var nextDeps = deps === void 0 ? null : deps;
          var prevState = hook.memoizedState;
          if (prevState !== null) {
            if (nextDeps !== null) {
              var prevDeps = prevState[1];
              if (areHookInputsEqual(nextDeps, prevDeps)) {
                return prevState[0];
              }
            }
          }
          hook.memoizedState = [callback, nextDeps];
          return callback;
        }
        function mountMemo(nextCreate, deps) {
          var hook = mountWorkInProgressHook();
          var nextDeps = deps === void 0 ? null : deps;
          var nextValue = nextCreate();
          hook.memoizedState = [nextValue, nextDeps];
          return nextValue;
        }
        function updateMemo(nextCreate, deps) {
          var hook = updateWorkInProgressHook();
          var nextDeps = deps === void 0 ? null : deps;
          var prevState = hook.memoizedState;
          if (prevState !== null) {
            if (nextDeps !== null) {
              var prevDeps = prevState[1];
              if (areHookInputsEqual(nextDeps, prevDeps)) {
                return prevState[0];
              }
            }
          }
          var nextValue = nextCreate();
          hook.memoizedState = [nextValue, nextDeps];
          return nextValue;
        }
        function mountDeferredValue(value) {
          var hook = mountWorkInProgressHook();
          hook.memoizedState = value;
          return value;
        }
        function updateDeferredValue(value) {
          var hook = updateWorkInProgressHook();
          var resolvedCurrentHook = currentHook;
          var prevValue = resolvedCurrentHook.memoizedState;
          return updateDeferredValueImpl(hook, prevValue, value);
        }
        function rerenderDeferredValue(value) {
          var hook = updateWorkInProgressHook();
          if (currentHook === null) {
            hook.memoizedState = value;
            return value;
          } else {
            var prevValue = currentHook.memoizedState;
            return updateDeferredValueImpl(hook, prevValue, value);
          }
        }
        function updateDeferredValueImpl(hook, prevValue, value) {
          var shouldDeferValue = !includesOnlyNonUrgentLanes(renderLanes);
          if (shouldDeferValue) {
            if (!objectIs(value, prevValue)) {
              var deferredLane = claimNextTransitionLane();
              currentlyRenderingFiber$1.lanes = mergeLanes(currentlyRenderingFiber$1.lanes, deferredLane);
              markSkippedUpdateLanes(deferredLane);
              hook.baseState = true;
            }
            return prevValue;
          } else {
            if (hook.baseState) {
              hook.baseState = false;
              markWorkInProgressReceivedUpdate();
            }
            hook.memoizedState = value;
            return value;
          }
        }
        function startTransition(setPending, callback, options2) {
          var previousPriority = getCurrentUpdatePriority();
          setCurrentUpdatePriority(higherEventPriority(previousPriority, ContinuousEventPriority));
          setPending(true);
          var prevTransition = ReactCurrentBatchConfig$2.transition;
          ReactCurrentBatchConfig$2.transition = {};
          var currentTransition = ReactCurrentBatchConfig$2.transition;
          {
            ReactCurrentBatchConfig$2.transition._updatedFibers = /* @__PURE__ */ new Set();
          }
          try {
            setPending(false);
            callback();
          } finally {
            setCurrentUpdatePriority(previousPriority);
            ReactCurrentBatchConfig$2.transition = prevTransition;
            {
              if (prevTransition === null && currentTransition._updatedFibers) {
                var updatedFibersCount = currentTransition._updatedFibers.size;
                if (updatedFibersCount > 10) {
                  warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.");
                }
                currentTransition._updatedFibers.clear();
              }
            }
          }
        }
        function mountTransition() {
          var _mountState = mountState(false), isPending = _mountState[0], setPending = _mountState[1];
          var start = startTransition.bind(null, setPending);
          var hook = mountWorkInProgressHook();
          hook.memoizedState = start;
          return [isPending, start];
        }
        function updateTransition() {
          var _updateState = updateState(), isPending = _updateState[0];
          var hook = updateWorkInProgressHook();
          var start = hook.memoizedState;
          return [isPending, start];
        }
        function rerenderTransition() {
          var _rerenderState = rerenderState(), isPending = _rerenderState[0];
          var hook = updateWorkInProgressHook();
          var start = hook.memoizedState;
          return [isPending, start];
        }
        var isUpdatingOpaqueValueInRenderPhase = false;
        function getIsUpdatingOpaqueValueInRenderPhaseInDEV() {
          {
            return isUpdatingOpaqueValueInRenderPhase;
          }
        }
        function mountId() {
          var hook = mountWorkInProgressHook();
          var root2 = getWorkInProgressRoot();
          var identifierPrefix = root2.identifierPrefix;
          var id;
          if (getIsHydrating()) {
            var treeId = getTreeId();
            id = ":" + identifierPrefix + "R" + treeId;
            var localId = localIdCounter++;
            if (localId > 0) {
              id += "H" + localId.toString(32);
            }
            id += ":";
          } else {
            var globalClientId = globalClientIdCounter++;
            id = ":" + identifierPrefix + "r" + globalClientId.toString(32) + ":";
          }
          hook.memoizedState = id;
          return id;
        }
        function updateId() {
          var hook = updateWorkInProgressHook();
          var id = hook.memoizedState;
          return id;
        }
        function dispatchReducerAction(fiber, queue, action) {
          {
            if (typeof arguments[3] === "function") {
              error("State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect().");
            }
          }
          var lane = requestUpdateLane(fiber);
          var update = {
            lane,
            action,
            hasEagerState: false,
            eagerState: null,
            next: null
          };
          if (isRenderPhaseUpdate(fiber)) {
            enqueueRenderPhaseUpdate(queue, update);
          } else {
            var root2 = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
            if (root2 !== null) {
              var eventTime = requestEventTime();
              scheduleUpdateOnFiber(root2, fiber, lane, eventTime);
              entangleTransitionUpdate(root2, queue, lane);
            }
          }
          markUpdateInDevTools(fiber, lane);
        }
        function dispatchSetState(fiber, queue, action) {
          {
            if (typeof arguments[3] === "function") {
              error("State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect().");
            }
          }
          var lane = requestUpdateLane(fiber);
          var update = {
            lane,
            action,
            hasEagerState: false,
            eagerState: null,
            next: null
          };
          if (isRenderPhaseUpdate(fiber)) {
            enqueueRenderPhaseUpdate(queue, update);
          } else {
            var alternate = fiber.alternate;
            if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes)) {
              var lastRenderedReducer = queue.lastRenderedReducer;
              if (lastRenderedReducer !== null) {
                var prevDispatcher;
                {
                  prevDispatcher = ReactCurrentDispatcher$1.current;
                  ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
                }
                try {
                  var currentState = queue.lastRenderedState;
                  var eagerState = lastRenderedReducer(currentState, action);
                  update.hasEagerState = true;
                  update.eagerState = eagerState;
                  if (objectIs(eagerState, currentState)) {
                    enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update, lane);
                    return;
                  }
                } catch (error2) {
                } finally {
                  {
                    ReactCurrentDispatcher$1.current = prevDispatcher;
                  }
                }
              }
            }
            var root2 = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
            if (root2 !== null) {
              var eventTime = requestEventTime();
              scheduleUpdateOnFiber(root2, fiber, lane, eventTime);
              entangleTransitionUpdate(root2, queue, lane);
            }
          }
          markUpdateInDevTools(fiber, lane);
        }
        function isRenderPhaseUpdate(fiber) {
          var alternate = fiber.alternate;
          return fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1;
        }
        function enqueueRenderPhaseUpdate(queue, update) {
          didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
          var pending = queue.pending;
          if (pending === null) {
            update.next = update;
          } else {
            update.next = pending.next;
            pending.next = update;
          }
          queue.pending = update;
        }
        function entangleTransitionUpdate(root2, queue, lane) {
          if (isTransitionLane(lane)) {
            var queueLanes = queue.lanes;
            queueLanes = intersectLanes(queueLanes, root2.pendingLanes);
            var newQueueLanes = mergeLanes(queueLanes, lane);
            queue.lanes = newQueueLanes;
            markRootEntangled(root2, newQueueLanes);
          }
        }
        function markUpdateInDevTools(fiber, lane, action) {
          {
            markStateUpdateScheduled(fiber, lane);
          }
        }
        var ContextOnlyDispatcher = {
          readContext,
          useCallback: throwInvalidHookError,
          useContext: throwInvalidHookError,
          useEffect: throwInvalidHookError,
          useImperativeHandle: throwInvalidHookError,
          useInsertionEffect: throwInvalidHookError,
          useLayoutEffect: throwInvalidHookError,
          useMemo: throwInvalidHookError,
          useReducer: throwInvalidHookError,
          useRef: throwInvalidHookError,
          useState: throwInvalidHookError,
          useDebugValue: throwInvalidHookError,
          useDeferredValue: throwInvalidHookError,
          useTransition: throwInvalidHookError,
          useMutableSource: throwInvalidHookError,
          useSyncExternalStore: throwInvalidHookError,
          useId: throwInvalidHookError,
          unstable_isNewReconciler: enableNewReconciler
        };
        var HooksDispatcherOnMountInDEV = null;
        var HooksDispatcherOnMountWithHookTypesInDEV = null;
        var HooksDispatcherOnUpdateInDEV = null;
        var HooksDispatcherOnRerenderInDEV = null;
        var InvalidNestedHooksDispatcherOnMountInDEV = null;
        var InvalidNestedHooksDispatcherOnUpdateInDEV = null;
        var InvalidNestedHooksDispatcherOnRerenderInDEV = null;
        {
          var warnInvalidContextAccess = function() {
            error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
          };
          var warnInvalidHookAccess = function() {
            error("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://reactjs.org/link/rules-of-hooks");
          };
          HooksDispatcherOnMountInDEV = {
            readContext: function(context) {
              return readContext(context);
            },
            useCallback: function(callback, deps) {
              currentHookNameInDev = "useCallback";
              mountHookTypesDev();
              checkDepsAreArrayDev(deps);
              return mountCallback(callback, deps);
            },
            useContext: function(context) {
              currentHookNameInDev = "useContext";
              mountHookTypesDev();
              return readContext(context);
            },
            useEffect: function(create, deps) {
              currentHookNameInDev = "useEffect";
              mountHookTypesDev();
              checkDepsAreArrayDev(deps);
              return mountEffect(create, deps);
            },
            useImperativeHandle: function(ref, create, deps) {
              currentHookNameInDev = "useImperativeHandle";
              mountHookTypesDev();
              checkDepsAreArrayDev(deps);
              return mountImperativeHandle(ref, create, deps);
            },
            useInsertionEffect: function(create, deps) {
              currentHookNameInDev = "useInsertionEffect";
              mountHookTypesDev();
              checkDepsAreArrayDev(deps);
              return mountInsertionEffect(create, deps);
            },
            useLayoutEffect: function(create, deps) {
              currentHookNameInDev = "useLayoutEffect";
              mountHookTypesDev();
              checkDepsAreArrayDev(deps);
              return mountLayoutEffect(create, deps);
            },
            useMemo: function(create, deps) {
              currentHookNameInDev = "useMemo";
              mountHookTypesDev();
              checkDepsAreArrayDev(deps);
              var prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
              try {
                return mountMemo(create, deps);
              } finally {
                ReactCurrentDispatcher$1.current = prevDispatcher;
              }
            },
            useReducer: function(reducer, initialArg, init) {
              currentHookNameInDev = "useReducer";
              mountHookTypesDev();
              var prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
              try {
                return mountReducer(reducer, initialArg, init);
              } finally {
                ReactCurrentDispatcher$1.current = prevDispatcher;
              }
            },
            useRef: function(initialValue) {
              currentHookNameInDev = "useRef";
              mountHookTypesDev();
              return mountRef(initialValue);
            },
            useState: function(initialState) {
              currentHookNameInDev = "useState";
              mountHookTypesDev();
              var prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
              try {
                return mountState(initialState);
              } finally {
                ReactCurrentDispatcher$1.current = prevDispatcher;
              }
            },
            useDebugValue: function(value, formatterFn) {
              currentHookNameInDev = "useDebugValue";
              mountHookTypesDev();
              return mountDebugValue();
            },
            useDeferredValue: function(value) {
              currentHookNameInDev = "useDeferredValue";
              mountHookTypesDev();
              return mountDeferredValue(value);
            },
            useTransition: function() {
              currentHookNameInDev = "useTransition";
              mountHookTypesDev();
              return mountTransition();
            },
            useMutableSource: function(source, getSnapshot, subscribe) {
              currentHookNameInDev = "useMutableSource";
              mountHookTypesDev();
              return mountMutableSource();
            },
            useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
              currentHookNameInDev = "useSyncExternalStore";
              mountHookTypesDev();
              return mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
            },
            useId: function() {
              currentHookNameInDev = "useId";
              mountHookTypesDev();
              return mountId();
            },
            unstable_isNewReconciler: enableNewReconciler
          };
          HooksDispatcherOnMountWithHookTypesInDEV = {
            readContext: function(context) {
              return readContext(context);
            },
            useCallback: function(callback, deps) {
              currentHookNameInDev = "useCallback";
              updateHookTypesDev();
              return mountCallback(callback, deps);
            },
            useContext: function(context) {
              currentHookNameInDev = "useContext";
              updateHookTypesDev();
              return readContext(context);
            },
            useEffect: function(create, deps) {
              currentHookNameInDev = "useEffect";
              updateHookTypesDev();
              return mountEffect(create, deps);
            },
            useImperativeHandle: function(ref, create, deps) {
              currentHookNameInDev = "useImperativeHandle";
              updateHookTypesDev();
              return mountImperativeHandle(ref, create, deps);
            },
            useInsertionEffect: function(create, deps) {
              currentHookNameInDev = "useInsertionEffect";
              updateHookTypesDev();
              return mountInsertionEffect(create, deps);
            },
            useLayoutEffect: function(create, deps) {
              currentHookNameInDev = "useLayoutEffect";
              updateHookTypesDev();
              return mountLayoutEffect(create, deps);
            },
            useMemo: function(create, deps) {
              currentHookNameInDev = "useMemo";
              updateHookTypesDev();
              var prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
              try {
                return mountMemo(create, deps);
              } finally {
                ReactCurrentDispatcher$1.current = prevDispatcher;
              }
            },
            useReducer: function(reducer, initialArg, init) {
              currentHookNameInDev = "useReducer";
              updateHookTypesDev();
              var prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
              try {
                return mountReducer(reducer, initialArg, init);
              } finally {
                ReactCurrentDispatcher$1.current = prevDispatcher;
              }
            },
            useRef: function(initialValue) {
              currentHookNameInDev = "useRef";
              updateHookTypesDev();
              return mountRef(initialValue);
            },
            useState: function(initialState) {
              currentHookNameInDev = "useState";
              updateHookTypesDev();
              var prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
              try {
                return mountState(initialState);
              } finally {
                ReactCurrentDispatcher$1.current = prevDispatcher;
              }
            },
            useDebugValue: function(value, formatterFn) {
              currentHookNameInDev = "useDebugValue";
              updateHookTypesDev();
              return mountDebugValue();
            },
            useDeferredValue: function(value) {
              currentHookNameInDev = "useDeferredValue";
              updateHookTypesDev();
              return mountDeferredValue(value);
            },
            useTransition: function() {
              currentHookNameInDev = "useTransition";
              updateHookTypesDev();
              return mountTransition();
            },
            useMutableSource: function(source, getSnapshot, subscribe) {
              currentHookNameInDev = "useMutableSource";
              updateHookTypesDev();
              return mountMutableSource();
            },
            useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
              currentHookNameInDev = "useSyncExternalStore";
              updateHookTypesDev();
              return mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
            },
            useId: function() {
              currentHookNameInDev = "useId";
              updateHookTypesDev();
              return mountId();
            },
            unstable_isNewReconciler: enableNewReconciler
          };
          HooksDispatcherOnUpdateInDEV = {
            readContext: function(context) {
              return readContext(context);
            },
            useCallback: function(callback, deps) {
              currentHookNameInDev = "useCallback";
              updateHookTypesDev();
              return updateCallback(callback, deps);
            },
            useContext: function(context) {
              currentHookNameInDev = "useContext";
              updateHookTypesDev();
              return readContext(context);
            },
            useEffect: function(create, deps) {
              currentHookNameInDev = "useEffect";
              updateHookTypesDev();
              return updateEffect(create, deps);
            },
            useImperativeHandle: function(ref, create, deps) {
              currentHookNameInDev = "useImperativeHandle";
              updateHookTypesDev();
              return updateImperativeHandle(ref, create, deps);
            },
            useInsertionEffect: function(create, deps) {
              currentHookNameInDev = "useInsertionEffect";
              updateHookTypesDev();
              return updateInsertionEffect(create, deps);
            },
            useLayoutEffect: function(create, deps) {
              currentHookNameInDev = "useLayoutEffect";
              updateHookTypesDev();
              return updateLayoutEffect(create, deps);
            },
            useMemo: function(create, deps) {
              currentHookNameInDev = "useMemo";
              updateHookTypesDev();
              var prevDispatcher = ReactCurrentDisp