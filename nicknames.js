// ==UserScript==
// @name         RohBot Nicknames
// @version      1.2.1
// @description  Allows the user set custom nicknames to other users
// @author       Spans
// @match        https://rohbot.net
// @grant        none
// @updateURL	 https://raw.githubusercontent.com/Spanfile/RohBot-Nicknames/master/nicknames.js
// ==/UserScript==
/* jshint -W097 */
'use strict';

var storeKey = "spans-nicknames";
var nicknames = {}; // id: { nick, original }

function loadNicks() {
	nicknames = JSON.parse(RohStore.get(storeKey) || "{}");
}

function saveNicks() {
	RohStore.set(storeKey, JSON.stringify(nicknames));
}

function unescape(str) {
	return $('<textarea/>').html(str).text();
}

cmd.register("nick", "--]", function (chat, args) {
	if (args.length != 3 || args[0].length === 0 || args[1].length === 0 || args[2].length === 0) {
		chat.statusMessage("Usage: /nick (id|name) nickname user");
		return;
	}
	
	var user;
	if (args[0] == "id") {
		user = chat.userList.find(function (user) { return user.UserId == args[2]; });
	} else if (args[0] == "name") {
		user = chat.userList.find(function (user) { return unescape(user.Name) == args[2]; });
	} else {
		chat.statusMessage("Usage: /nick (id|name) nickname user");
		return;
	}
	
	if (!user) {
		chat.statusMessage("Who's " + args[2] + "?");
		return;
	}
	
	nicknames[user.UserId] = { nick: args[1], original: user.Name };
	chat.statusMessage(user.Name + " is now " + args[1] + "!");
	
	saveNicks();
});

cmd.register("removenick", "-]", function (chat, args) {
	if (args.length != 2 || args[0].length === 0 || args[0].length === 0) {
		chat.statusMessage("Usage: /removenick (id|name) nickname|id");
		return;
	}
	
	var user;
	if (args[0] == "id") {
		user = chat.userList.find(function (user) { return user.UserId == args[1]; });
	} else if (args[0] == "name") {
		user = chat.userList.find(function (user) { return unescape(user.Name) == args[1]; });
	} else {
		chat.statusMessage("Usage: /nick (id|name) nickname user");
		return;
	}
	
	if (!user) {
		chat.statusMessage("Who's " + args[1] + "?");
		return;
	}
	
	if (!nicknames[user.UserId]) {
		chat.statusMessage(user.Name + " doesn't have a nickname :(");
		return;
	}
	
	chat.statusMessage(user.Name + " is just now " + nicknames[user.UserId].original + " :(");
	delete nicknames[user.UserId];
	
	saveNicks();
});

cmd.register("whois", "]", function (chat, args) {
	if (args.length != 1 || args[0].length === 0) {
		chat.statusMessage("Usage: /whois nickname");
		return;
	}
	
	var user = chat.userList.find(function (user) { return unescape(user.Name) == args[0]; });
	if (!user) {
		chat.statusMessage("Who's " + args[0] + "?");
		return;
	}
	
	var nick = nicknames[user.UserId];
	if (!nick) {
		chat.statusMessage(args[0] + " is just " + args[0] + " :(");
		return;
	}
	
	chat.statusMessage("That's " + nick.original + "!");
});

chatMgr.lineFilter.add(function (line, prepend, e) {
	if (line.Sender) {
		var nick = nicknames[line.SenderId];
		
		if (nick) {
			line.Sender = nick.nick;
		}
	} else {
		var nick = nicknames[line.ForId];
		
		if (nick) {
			line.For = nick.nick;
		}
		
		if (line.By) {
			var nick = nicknames[line.ById];
			
			if (nick) {
				line.By = nick.nick;
			}
		}
	}
});

chatMgr.userFilter.add(function (user, e) {
	var nick = nicknames[user.UserId];
	
	if (nick) {
		user.Name = nick.nick;
	}
});

loadNicks();
