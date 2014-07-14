var service = new LanguageService();
var serviceMap = {
  'typeFromPosition': service.typeFromPosition,
  'checkForDiagnostics': service.checkForDiagnostics,
  'checkForCompletions': service.checkForCompletions
};

self.onmessage = function(message) {
  message = message['data'];
  try {
    self.postMessage({
      'id': message['id'],
      'output': serviceMap[message['task']].apply(service, message['input'])
    });
  } catch (e) {
    console.error(e && e.stack || e);
    self.postMessage({
      'id': message['id'],
      'output': null
    });
  }
};

Error.stackTraceLimit = 100;
