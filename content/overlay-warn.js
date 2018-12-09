window.addEventListener("load", function windowLoader(e) { 
    this.window.removeEventListener("load", windowLoader, false);   // Only need it to run this _one_ time
	startup(); 
}, false);

function startup() {
    let mailMessagePane = document.getElementById("messagepane");
    mailMessagePane.addEventListener("load", function messagePaneLoader(e){
        //
        // Read relevant domains:
        //  from
        //  reply-to

        // First, get the message 'header' (Internal Thunderbird concept, not a 'mail header' like 'reply-to')
        let selectedMessage = gFolderDisplay.selectedMessageUris[0];
        let mheader = Components.classes['@mozilla.org/messenger;1']
                     .getService(Components.interfaces.nsIMessenger)
                     .msgHdrFromURI(selectedMessage);


        //
        // Get the mime message so we can parse headers
        MsgHdrToMimeMessage(mheader, null, function(msgHdr, mimedMessage){
            //
            // Callback hell since I need the message in mime format to continue


            // Now, read the headers and get the relevant domains (for 'from' and 'reply-to'):
            let domains = [];
            if (mimedMessage.has("from")) {
                var email = mimedMessage.get("from");

                // Try to get just the 'domain' piece (including any relevant subdomains)
                var emailPieces = email.split("@");
                var rawDomains = emailPieces[emailPieces.length -1];

                var cleanDomain = rawDomains.match(/([a-z0-9|-]+\.)*[a-z0-9|-]+\.[a-z]+/);
                domains.push(cleanDomain[0]);
            }
            if (mimedMessage.has("reply-to")) {
                var email = mimedMessage.get("reply-to");

                // Try to get just the 'domain' piece (including any relevant subdomains)
                var emailPieces = email.split("@");
                var rawDomains = emailPieces[emailPieces.length -1];
                var cleanDomain = rawDomains.match(/([a-z0-9|-]+\.)*[a-z0-9|-]+\.[a-z]+/);

                domains.push(cleanDomain[0]);
            }

            //
            // For each domain, make a request to the Whois caching server to get domain details
            // https://github.com/rioncarter/whois-caching-proxy
            for(var i=0; i<domains.length; i++){
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function domainReply(){
                    if(this.readyState == 4 && this.status == 200){
                        // check the date (is it less than 7 months old?)
                        let domain = JSON.parse(this.responseText);
                        let domainDate = new Date(domain.RegisteredDate);

                        let now = Date.now();   // gets current time in milliseconds
                        let diffMs = now - domainDate.getTime();    // Get time in milliseconds
                        let diffDays = diffMs/(1000*60*60*24);      // Difference in days
                        if (diffDays < 216){
                            //
                            // If the domain was registered less than 216 days ago (about 7 months), flag it
                            displayNotification(domain.Name);
                        }
                    }
                };
                // This is the default port and http API for the whois-caching-proxy
                // As this is Alpha quality MVP software, the location is hard-coded and it lacks TLS protection
                xhttp.open("GET", "http://localhost:9091/checkDomain/"+domains[i], true);
                xhttp.send();
            }
        });

    }, true);
}

//
// Call this to add a notification of a suspicious domain if one is found
// Todo: It would be nice to alert based on the date of the message sent rather than 'today' to better see over time what suspicious messages have come our way
function displayNotification(domain){
    // Show a message in the notification bar
    let msgNotificationBar = document.getElementById("msgNotificationBar");

    msgNotificationBar.appendNotification("Suspicious domain: " + domain, "suspiciousDomainFound",
        "chrome://messenger/skin/icons/move-up.svg",
        msgNotificationBar.PRIORITY_CRITICAL_HIGH,
        []);
}

