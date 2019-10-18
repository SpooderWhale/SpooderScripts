// ==UserScript==
// @name         SSAH Chat Enhancements
// @namespace    https://auctionhouse.club
// @version      0.5.7
// @description  Adds various chat enhancements to SSAH.
// @author       Ninshubur /|\(♥.♥)/|\
// @match        https://auctionhouse.club/
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/randomcolor/0.5.4/randomColor.js
// @downloadURL  https://pastebin.com/raw/D90X42Dy
// ==/UserScript==

(function() {


    // ## USER CONFIG ##
    var enable_image_previews = true; // change this false to disable image previews
    var image_preview_height = 256; // this sets the maximum image preview height

    // ## CHANGELOG ##
    // v0.5.7: Wide images will now auto-scale height up to max (thx fish).
    //       : Leaderboard now updates @ 2mins after hour instead of 1hr after page load.
    // v0.5.6.2: Small formatting tweaks. Removed !command code.
    // v0.5.6.1: Rolled back !discord auto-chat. Multiple windows will all send response. :(
    // v0.5.6: Fixed Scroll button appearing in place of 'Quick Join' link when logged out.
    //       : Added Icons to Seller. Colored Current Bidder based on whether it's you.
    //       : Added !discord macro. Anti-spam cooldown set to 5 minutes between auto-chat sends.
    //       : Added Max-Length to chat input box. Why waste time say lot word when few word do trick?
    //       : Fixed emote text not getting an icon.
    //       : Adjusted
    // v0.5.5: Added /me emote text.
    //       : Added Scroll lock button to Chat header (default ON)
    // v0.5.4: Fixed newbie's name changing to NaN
    //       : Added logic to allow script to work if pasted into console (but without name coloring)
    //       : Reduced processing interval to 1ms (from 100ms)
    // v0.5.3: Added Rank Icon to current bidder.
    // v0.5.2: Added Leaderboard Rank & Slave Count hover text to names.
    // v0.5.1: User colornames should no longer change based on attaching emoji.
    //       : Fixed 🎨 tagging (broken in v0.5)
    // v0.5  : Added Leaderboard ranks to all users based on slaves owned
    //       : 🐋2000+ 🐳500+ 🐬300+ 🐟100+ 🍤[Any LB Rank] 🌱[No LB Rank]
    // v0.4.1: Changed artist emoji to 🎨
    // v0.4  : Added Dynamic Whale tagging (top 3 slaves owned)
    // v0.3  : Added Auto-Update url to userscript.
    // v0.2  : Fixed @mention pattern matching. (RIP su)
    // v0.1  : Initial release

    // ## DONT CHANGE ANYTHING AFTER THIS LINE ##
    // ------------------------------------------------
    // (or do it. I'm not ur mom.) vOv

    // TODO: Update artist username list to actually be exhaustive.

    var artist_list = ['Gluttonace', 'Abyss', 'SneezyAnus', 'PurpleMist', 'fumophu', 'MalberryBush'];
    var whale_list = new Array();
    var whale_index = new Array();
    var vip_list = ['Gluttonace', 'OP'];
    var myname = user['username'];
    var first_pass = true;
    var message_count = 0;
    var version = 0.3;
    var leaderboard = {};
    var leaderboard_update_time = null;
    var auto_scroll_enabled = false;
    var emoji_list = {'MEGAWHALE': '🐋', 'Whale': '🐳', 'BabyWhale': '🐬', 'Fish': '🐟', 'Shrimp': '🍤', 'Newbie': '🌱', 'Artist': '🎨', 'Spooder': '🕷️', 'AH': '🎲'};

    var old_chat_count = 0;

    function rnonerror(req, error) {
        console.log('Got error: ' + error);
    };

    function rnsendajax(go_url, call_success, call_complete) {
        let promise = $.ajax({
            url: go_url,
            type: "POST",
            data: {},
            cache: false,
            success: function(response) {
                if(call_success) {
                    return call_success(response);
                }
            },
            error: rnonerror,
            complete: function(req, status) {
                if(call_complete) {
                    return call_complete(req, status);
                }
            }
        });
    };

    function ninupdateleaderboard(callback) {
        let now = new Date();
        leaderboard_update_time = now.getHours();
        rnsendajax(
            base_url + 'cache/' + now.getFullYear() + '-' + (now.getMonth()+1) +'_slaves_owned',
            function(response) {
                let data = $.parseJSON(response);

                if (data['owners']) {
                    leaderboard = data['owners'];
                }
                if(callback) {
                    callback();
                }
            });
    };

    function ninprocessleaderboard() {
        whale_list = [];
        whale_index = [leaderboard[0].username];
        // #1 ALWAYS MEGAWHALE
        whale_list[leaderboard[0].username] = emoji_list.MEGAWHALE;
        for(var i = 1; i < leaderboard.length; i++) {
            let row = leaderboard[i]
            whale_index.push(row.username);
            if(row.slaves_owned >= 2000) {                        // MEGAWHALE: 2000+ Slaves
                whale_list[row.username] = emoji_list.MEGAWHALE;
            } else if(row.slaves_owned >= 500) {                  // Whale: 500+ Slaves
                whale_list[row.username] = emoji_list.Whale;
            } else if(row.slaves_owned >= 300) {                  // BabyWhale: 300+ Slaves
                whale_list[row.username] = emoji_list.BabyWhale;
            } else if(row.slaves_owned >= 100) {                  // Fish: 100+ Slaves
                whale_list[row.username] = emoji_list.Fish;
            } else {                                              // Shrimp: On Leaderboard
                whale_list[row.username] = emoji_list.Shrimp;
            }
        }
        // adds 🎨 in front of Artist's names
        artist_list.forEach(function(artist) {
            if(whale_list[artist]) {
                whale_list[artist] += emoji_list.Artist;
            } else {
                whale_list[artist] = emoji_list.Artist;
            }
        });

        // Tag Special Cases (AH/Spooderbot)
        // todo: fish for fish
        whale_list['fish'] = emoji_list.Fish;
        whale_list['Spooderbot'] = emoji_list.Spooder;
        whale_list['Auction House'] = emoji_list.AH;
        console.log('SSAH.CE: Leaderboard Processed. Updating ranks...');
    };

    function ninBidEnhance() {
        // Adds Rank Icons to Bidder Names
        let bidder_name = document.getElementById('current_bidder');
        if(!bidder_name.innerText.match(/([\uD800-\uDBFF][\uDC00-\uDFFF])/, 'g') && !bidder_name.innerText == '') {
            if(bidder_name.innerText == user.username) {
                bidder_name.style.color = 'green';
            } else {
                bidder_name.style.color = 'red';
            }
            if (Object.keys(whale_list).includes(bidder_name.innerText)) {
                bidder_name.innerText = whale_list[bidder_name.innerText] + bidder_name.innerText;
            } else {
                bidder_name.innerText = emoji_list.Newbie + bidder_name.innerText;
            }
        }
        let seller_name = document.getElementById('seller');
        if(!seller_name.innerText.match(/([\uD800-\uDBFF][\uDC00-\uDFFF])/, 'g') && !seller_name.innerText == '') {
            if (Object.keys(whale_list).includes(seller_name.innerText)) {
                seller_name.innerText = whale_list[seller_name.innerText] + seller_name.innerText;
            } else {
                seller_name.innerText = emoji_list.Newbie + seller_name.innerText;
            }
        }
    };



    // Replaces Chat header with Auto-Scroll Toggle Button
    function ninaddScrollLock() {
        let chatheader = document.querySelector("div.chat_title .lead");
        let newButton = document.createElement('button');
        newButton.innerHTML = 'Scroll Lock ON';
        newButton.style.color = 'green';
        newButton.onclick = ninToggleScrollLock;
        newButton.id = 'nin_scrolllock';
        chatheader.parentNode.style.paddingBottom = '14px';
        chatheader.parentNode.replaceChild(newButton, chatheader);
        auto_scroll_enabled = true;
    };

    function ninToggleScrollLock() {
        let scrollButton = document.querySelector("#nin_scrolllock");
        if(scrollButton.innerHTML == 'Scroll Lock OFF') {
            scrollButton.innerHTML = 'Scroll Lock ON';
            scrollButton.style.color = 'green';
            auto_scroll_enabled = true;
        } else {
            scrollButton.innerHTML = 'Scroll Lock OFF';
            scrollButton.style.color = 'red';
            auto_scroll_enabled = false;
        }
    };

    // scrolls chatbox to bottom
    function ninScrollChat() {
        let chatbox = document.querySelector("#chat_parent");
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    function chatEnhance() {
        ninBidEnhance();
        let chats = document.querySelectorAll(".chat_item");
        if(chats.length > 0 && old_chat_count == 0) {
            old_chat_count = chats.length - 1;
        }
        for (var i = 0; i < chats.length; i++) {
            if(chats[i].getAttribute("class").includes('nin_processed')) { continue; }
            if(leaderboard.length == 100) { message_count++; }

            let speaker = chats[i].querySelector('.chat_username').innerText;
            let speakername = speaker.trim().split(':')[0];
            let message = chats[i].querySelector('.chat_message').innerText;

            // shades background color light-grey for your own messages
            if(speaker.includes(myname)) {
                chats[i].setAttribute('style', 'background-color: #333333');
            }

            // shades background color light-red if you're mentioned in a message
            let regpat = new RegExp('\\b' + myname + '\\b', 'i');
            if(message.match(regpat) && !speaker.includes(myname)) {
                chats[i].setAttribute('style', 'background-color: #440000');
            }

            // Adds timestamp based on current time.
            if(!chats[i].querySelector('.chat_timestamp')) {
                let today = new Date();
                let timestamp = document.createElement('span');
                timestamp.setAttribute('class', 'chat_timestamp');
                if(first_pass) {
                    timestamp.innerHTML = '-:-:- '; // old chat lines have no
                } else {
                    timestamp.innerHTML = today.toLocaleTimeString('en-US', {timeZone: "America/New_York"}).split(' ')[0] + ' ';
                }
                timestamp.setAttribute('style', 'color: Gainsboro');
                chats[i].querySelector('.chat_username').insertAdjacentElement("beforebegin", timestamp);
            }

            // adds in-line image previews - (only works for first image)
            var img_types = ['.png', '.gif', '.jpg']; // supported image types
            if(enable_image_previews) {
                var link_span = chats[i].querySelector('.chat_message').querySelector('.embedica_link')
                var img_check = chats[i].querySelector('.chat_img');
                if(link_span && !img_check) {
                    var link = link_span.querySelector("a");
                    if(img_types.includes(link.innerText.slice(-4))) {
                        var img_div = document.createElement('div');
                        img_div.setAttribute('class', 'chat_img');
                        img_div.setAttribute('style', 'width: 100%');
                        var img = document.createElement('img');
                        img.setAttribute('src', link.innerText);
                        img.setAttribute('style', 'object-fit: contain; height:100%; width:100%; max-height:' + image_preview_height + 'px');

                        img_div.appendChild(img);
                        chats[i].appendChild(img_div);
                    }
                }
            }

            // sets VIP chat color to blue
            vip_list.forEach(function(vip) {
                if(speaker.trim().slice(0,-1) == vip) {
                    chats[i].querySelector('.chat_message').style.color = '#428bca';
                }
            });

            // adds leaderboard & artist emoji to usernames
            if(leaderboard.length == 100) {
                if(whale_list[speakername]) {
                    chats[i].querySelector('.chat_username').innerText = whale_list[speakername] + speakername + ':';
                } else if(speakername != 'Spooderbot') {
                    chats[i].querySelector('.chat_username').innerText = emoji_list.Newbie + speakername + ':';
                }
                // Add Tooltip Text
                if(Object.keys(whale_list).includes(speakername)) {
                    if(speakername == "Spooderbot") {
                        chats[i].querySelector('.chat_username').setAttribute('Title', '/|\\(♥.♥)/|\\');
                    } else if(whale_index.includes(speakername)) {
                    let title_data = leaderboard[whale_index.indexOf(speakername)];
                    let title_text = 'Rank #' + (whale_index.indexOf(speakername)+1) + ' • Slaves ' + title_data.slaves_owned;
                    chats[i].querySelector('.chat_username').setAttribute('Title', title_text);
                    }
                }
            }

            // sets speaker's name color
            if(speakername == 'Gluttonace') {
                chats[i].querySelector('.chat_username').style.color = '#E8177F';
            } else if(speakername == 'Spooderbot') {
                chats[i].querySelector('.chat_username').style.color = 'Gainsboro';
            } else if(typeof randomColor != "undefined") {
                chats[i].querySelector('.chat_username').style.color = randomColor({luminosity: 'light', seed: speakername});
            }

            // adds /me emote color & italics
            if(leaderboard.length == 100) {
                if(message.startsWith('/me ')) {
                    let messagetext = message.toString().trim().split('/me ')[1];
                    let speakertext = chats[i].querySelector('.chat_username').innerText.split(':')[0];
                    chats[i].querySelector('.chat_username').innerText = speakertext;
                    chats[i].querySelector('.chat_message').innerText = messagetext;
                    chats[i].querySelector('.chat_message').style.color = chats[i].querySelector('.chat_username').style.color;
                    chats[i].querySelector('.chat_message').style.fontStyle = 'italic';
                    chats[i].querySelector('.chat_message').style.fontSize = '1em';
                }
            }

            // adds .nin_processed class once processed with emojis
            if(leaderboard.length == 100) { chats[i].classList.add('nin_processed'); }
        };
        if(first_pass && (message_count > old_chat_count) && old_chat_count > 0) {
            $('#chat_parent').scrollTop($('#chat_parent')[0].scrollHeight);
            first_pass = false;
            console.log('SSAH.CE: Finished first pass. Processed ' + message_count + ' old messages.');
        } // unsets first_pass flag to allow timestamp generation for new messages

        if(auto_scroll_enabled) { ninScrollChat(); }
    };

    function ninfixthings() {
        document.querySelector('#chat_input').maxLength = '255';
    };

    function nininit() {
        ninfixthings();
        ninaddScrollLock();
    };

    if (typeof GM_info != "undefined") {
        console.log('SSAH Chat Enchanements v' + GM_info.script.version + ' by Ninshubur /|\\(♥.♥)/|\\.');
    } else {
        console.log('SSAH Chat Enchanements by Ninshubur /|\\(♥.♥)/|\\.');
    }
    ninupdateleaderboard(ninprocessleaderboard);
    $( document ).ready(function() {
        nininit();
        window.setInterval(function(){
            let now = new Date();
            if(leaderboard_update_time != now.getHours() && now.getMinutes() > 2) { ninupdateleaderboard(ninprocessleaderboard); }
            chatEnhance();
        }, 1);
    });

})();