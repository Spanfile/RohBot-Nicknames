// ==UserScript==
// @name         RohBot Nicknames
// @version      1.1
// @description  Allows the user set custom nicknames to other users
// @author       Spans
// @match        https://rohbot.net
// @grant        none
// @updateURL	 https://raw.githubusercontent.com/Spanfile/RohBot-Nicknames/master/nicknames.js
// ==/UserScript==
/* jshint -W097 */
'use strict';

var storeKey = "spans-nicknames";
var nicknames = {};

function loadNicks() {
	nicknames = JSON.parse(RohStore.get(storeKey) || "{}");
}

function saveNicks() {
	RohStore.set(storeKey, JSON.stringify(nicknames));
}

function unescape(str) {
	return $('<textarea/>').html(str).text();
}

cmd.register("nick", "-]", function (chat, args) {
	if (args.length != 2 || args[0].length === 0 || args[1].length === 0) {
		chat.statusMessage("Usage: /nick user nickname");
		return;
	}
	
	var user = chat.userList.find(function (user) { return unescape(user.Name) == args[0]; });
	if (!user) {
		chat.statusMessage("Who's " + args[0] + "?");
		return;
	}
	
	nicknames[user.UserId] = args[1];
	chat.statusMessage(args[0] + " is now " + args[1] + "!");
	
	saveNicks();
});

cmd.register("removenick", "-", function (chat, args) {
	if (args.length != 1 || args[0].length === 0) {
		chat.statusMessage("Usage: /removenick nickname");
		return;
	}
	
	var user = chat.userList.find(function (user) { return unescape(user.Name) == args[0]; });
	if (!user) {
		chat.statusMessage("Who's " + args[0] + "?");
		return;
	}
	
	delete nicknames[user.UserId];
	chat.statusMessage(args[0] + " ain't " + args[0] + " anymore :(");
	
	saveNicks();
});

chatMgr.lineFilter.add(function (line, prepend, e) {
	if (line.Sender) {
		var nick = nicknames[line.SenderId];
		
		if (nick) {
			line.Sender = nick;
		}
	} else {
		var nick = nicknames[line.ForId];
		
		if (nick) {
			line.For = nick;
		}
		
		if (line.By) {
			var nick = nicknames[line.ById];
			
			if (nick) {
				line.By = nick;
			}
		}
	}
});

chatMgr.userFilter.add(function (user, e) {
	var nick = nicknames[user.UserId];
	
	if (nick) {
		user.Name = nick;
	}
});

loadNicks();
