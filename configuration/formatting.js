// Function for formatting response of Database.
module.exports = function formattingResponse(response, status, view, title, message, retornoJson) {
  response.status(status);
  response.format({
    //HTML response will render the view template.
    html: function () {
      response.render(view, {
        "title": title,
        "message": message
      });
    },
    //JSON response will return the JSON output
    json: function () {
      response.json(message);
    }
  });
}