# About
This is a plugin for the Thunderbird email client. It leverages a caching whois server (see the `whois-caching-proxy` repo) to check the age of the senders domain as well as the `reply-to` domain if any is configured in the email message.

When a suspicious domain is detected a notification bar item is placed on the message indicating that a domain is 'suspicious'.

This is Alpha quality / proof of concept

# How do I use this?
- First, run an instance of the `whois-caching-proxy` (sibling repo to this one)
- Next, package this plugin as an XPI and install it in Thunderbird

