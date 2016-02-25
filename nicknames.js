// ==UserScript==
// @name         RohBot Nicknames
// @version      1.3
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

function getUser(value, chat, fromNicks) {
	if (!fromNicks) {
		var user = chat.userList.find(function (u) { return unescape(u.Name) == value; });
		if (user)
			return { UserId: user.UserId, Name: user.Name };
		
		if ($.isNumeric(value)) {
			user = chat.userList.find(function (u) { return u.UserId == value; });
			if (user)
				return { UserId: user.UserId, Name: user.Name };
			
			return { UserId: value, name: "[who the fuck]" };
		}
	} else {
		var pairs = _.pairs(nicknames); // [ [ id, { nick, original } ], ... ]
		var user =
			pairs.find(function (p) { return p[0] == value; }) ||
			pairs.find(function (p) { return unescape(p[1].nick) == value; }) ||
			pairs.find(function (p) { return unescape(p[1].original) == value; });
		
		if (user)
			return { UserId: user[0], Name: user[1].original };
	}
	
	return null;
}

cmd.register("nick", "-]", function (chat, args) {
	if (args.length != 2 || args[0].length === 0 || args[1].length === 0) {
		chat.statusMessage("Usage: /nick nickname user/id");
		return;
	}
	
	var user = getUser(args[1], chat);	
	if (!user) {
		chat.statusMessage("Who's " + args[1] + "?");
		return;
	}
	
	nicknames[user.UserId] = { nick: args[0], original: user.Name };
	chat.statusMessage(user.Name + " is now " + args[0] + "!");
	
	saveNicks();
});

cmd.register("removenick", "]", function (chat, args) {
	if (args.length != 1 || args[0].length === 0) {
		chat.statusMessage("Usage: /removenick user/nickname/id");
		return;
	}
	
	var user = getUser(args[0], chat, true);
	if (!user) {
		chat.statusMessage("Who's " + args[0] + "?");
		return;
	}
	
	chat.statusMessage(user.Name + " is just now " + nicknames[user.UserId].original + " :(");
	delete nicknames[user.UserId];
	
	saveNicks();
});

cmd.register("whois", "]", function (chat, args) {
	if (args.length != 1 || args[0].length === 0) {
		chat.statusMessage("Usage: /whois user/nickname/id");
		return;
	}
	
	var user = getUser(args[0], chat);
	if (!user) {
		chat.statusMessage("Who's " + args[0] + "?");
		return;
	}
	
	var nick = nicknames[user.UserId];
	if (nick) {
		chat.statusMessage(user.Name + ": ID " + user.UserId + ", originally " + nick.original + ", nicknamed " + nick.nick);
	} else {
		chat.statusMessage(user.Name + ": ID " + user.UserId);
	}
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
