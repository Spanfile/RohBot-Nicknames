// ==UserScript==
// @name         RohBot Nicknames
// @version      1.0
// @description  Allows the user set custom nicknames to other users
// @author       Spans
// @match        https://rohbot.net
// @grant        none
// @updateURL	 
// ==/UserScript==
/* jshint -W097 */
'use strict';

// largely based on Rohan's FILTERED.js
// https://gist.github.com/Rohansi/f503530f91c8714089bf

function unescape(str) {
	return $("<textarea/>").html(str).text();
}

function filter(obj, predicate) {
	var result = {};
	
	for (var key in obj) {
		if (obj.hasOwnProperty(key) && !predicate(key, obj[key])) {
			result[key] = obj[key];
		}
	}
	
	return result;
}

var storeKey = "spans-nicknames";
var matchers = {
	name: {
		line: function (line, value) { return unescape(line.Sender) == value; },
		user: function (user, value) { return unescape(user.Name) == value; }
	},
	id: {
		line: function (line, value) { return unescape(line.SenderId) == value; },
        user: function (user, value) { return unescape(user.UserId) == value; }
	}
};
var nicknames = {}; // "id|name": { matcher, nick }

function save() {
	RohStore.set(storeKey, JSON.stringify(nicknames));
}

function load() {
	nicknames = JSON.parse(RohStore.get(storeKey) || "{}");
}

cmd.register("nick", "--]", function(chat, args) {
	if (args.length != 3 || args[1].length === 0 || args[2].length === 0 || !matchers.hasOwnProperty(args[0])) {
		chat.statusMessage("Usage: /nick (name|id) user nickname");
		return;
	}
	
	var nick = { matcher: args[0], nick: args[2] };
	nicknames[args[1]] = nick;
	chat.statusMessage(args[1] + " is now " + nick.nick + "!");
	
	save();
});

cmd.register("removenick", "-]", function(chat, args) {
	if (args.length != 2 || args[1].length === 0 || !matchers.hasOwnProperty(args[0])) {
		chat.statusMessage("Usage: /removenick (name|id) user");
		return;
	}
	
	nicknames = filter(nicknames, function (original, nick) { return original == args[1] || nick.nick == args[1]; });
	chat.statusMessage(args[1] + " is not " + args[1] + " anymore :(");
	
	save();
});

cmd.register("whois", "-", function(chat, args) {
	if (args.length != 1 || args[0].length === 0) {
		chat.statusMessage("Usage: /whois nickname");
		return;
	}
	
	for (var key in nicknames) {
		if (nicknames[key].nick == args[0]) {
			chat.statusMessage("It's " + key + "!");
			return;
		}
	}
	
	chat.statusMessage("That ain't nobody :<");
});

chatMgr.lineFilter.add(function (line, prepend, e) {
	for (var key in nicknames) {
		var nick = nicknames[key];
		
		if (matchers[nick.matcher].line(line, key)) {
			line.Sender = nick.nick;
			break;
		}
	}
});

chatMgr.userFilter.add(function (user, e) {
	for (var key in nicknames) {
		var nick = nicknames[key];
		
		if (matchers[nick.matcher].user(user, key)) {
			user.Name = nick.nick;
			break;
		}
	}
});

load();
