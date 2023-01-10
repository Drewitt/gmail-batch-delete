/**
 * A Google AppsScript to bulk delete emails from Gmail that match a given query string (i.e. what you would use to search in Gmail UI search box).
 * Script uses Gmail API in AppsScript (https://developers.google.com/apps-script/advanced/gmail) rather than native Gmail service provided in AppScript for performance.
 * Script can be executed as a 1-off or set to run with a time based trigger.
 * Note: Rate limits assume a business or enterprise subscription to Google Workspace/Gmail. If on a free Gmail account, please adjust accordingly.
 * Note: Default queryString will find/delete emails in inbox older than 3 months. PLEASE EDIT TO YOUR USE CASE BEFORE USE!
 * Author: F.Drewitt
 */

function deleteByGmailAPI() {
  var maxSearchResults = 500 // per https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
  var sleepSeconds = 1 // Sleep between loops to keep under 250 quota units per second rate limit per https://developers.google.com/gmail/api/reference/quota 
  var queryString = 'label:inbox older_than:3m'
  var maxErrors = 5 // arbitary error limit to exit

  try {

    let pageToken;
    let errCount = 0;
    do {

      try {
        const messageList = Gmail.Users.Messages.list('me', {
        q: queryString,
        maxResults: maxSearchResults,
        pageToken: pageToken
        });
        console.log('Search found results: ' + messageList.messages.length)
        
        pageToken = messageList.nextPageToken;
        console.log('Next pageToken set: ' + pageToken)      
        
        if(messageList.messages){
          var msgIds = messageList.messages.map(messages => messages.id);
          Gmail.Users.Messages.batchDelete({'ids': msgIds}, 'me');
          console.log('Submitted Ids for deletion')
          Utilities.sleep(sleepSeconds*1000)
        }

      } catch (err) {
        errCount++;
        if (errCount <= maxErrors) {
          Utilities.sleep (5000) //sleep for 5 sec on error to prevent flooding
          console.log('Sleeping for 5 seconds after error: ' + err)
        } else {
        throw err
        }
      }   
    } while (pageToken);
  
  }   catch (err) {
    console.log('Exceeded retries, Outer error: ' + err)
  }
}
