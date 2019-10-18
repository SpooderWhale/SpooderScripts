// ==UserScript==
// @name         SSAH Enhanced Auction House
// @namespace    https://auctionhouse.club/
// @version      0.1
// @description  Enhances the Auction House!
// @author       Ninshubur /|\(♥.♥)/|\
// @match        https://auctionhouse.club/
// @grant        none
// @downloadURL  https://pastebin.com/raw/ck0rhznG
// ==/UserScript==

(function() {

    // ## CHANGELOG ##
    // v0.1: Initial Release

    let statblock = document.querySelector("#slave_temperament").parentNode.parentNode;
    let stats = new Array();
    let msg_statline_inactive = '/|\\(♥.♥)/|\\';
    let memes = true;

    function ninhanceStats() {
        let statline = document.querySelector("#nin_statline");
        stats.temperament = document.querySelector("#slave_temperament").querySelectorAll(".glyphicon-star").length;
        stats.condition = document.querySelector("#slave_condition").querySelectorAll(".glyphicon-star").length;
        stats.oral = document.querySelector("#slave_oral_skill").querySelectorAll(".glyphicon-star").length;
        stats.riding = document.querySelector("#slave_riding_skill").querySelectorAll(".glyphicon-star").length;
        stats.anal = document.querySelector("#slave_anal_skill").querySelectorAll(".glyphicon-star").length;
        stats.virgin = document.querySelector("#slave_is_virgin").querySelectorAll(".glyphicon-star").length;
        let statline_text = ninprintstats(stats);
        if(stats.temperament) {
            if(statline.innerText != statline_text) {
                statline.innerText = statline_text; }
        } else if(statline.innerText != msg_statline_inactive) {
            statline.innerText = msg_statline_inactive;
        }
    };

    function ninprintstats(stats) {
        let output = ''
        if(stats.temperament + stats.condition + stats.oral + stats.riding + stats.anal == 25) {
            output = '-HARDCORE-';
        } else {
            output += stats.temperament + ' • ' + stats.condition + ' • ' + [stats.oral, stats.riding, stats.anal].join("");
        }
        if(stats.virgin) {
            output = '⭐ ' + output + ' ⭐';
        }
        return output;
    };

    function ninmemes() {
        let tiggle_button = document.querySelector("button[value='100000']");
        tiggle_button.childNodes[2].textContent = ' 1 Tigbit 🐋';
    }

    function nininit() {
        statblock.style.display = "none";
        let statline_row = document.createElement('div');
        statline_row.classList.add('row');
        let statline_info_line = document.createElement('div');
        statline_info_line.classList.add('col-md-12');
        statline_info_line.classList.add('info_line');
        statline_info_line.id = 'nin_statline';
        statline_info_line.style.textAlign = 'center';
        statline_row.appendChild(statline_info_line);
        statblock.insertAdjacentElement("beforebegin", statline_row);
        if(memes) { ninmemes(); }
    };

    console.log('SSAH Enhanced Auction House by Ninshubur /|\\(♥.♥)/|\\');
    $( document ).ready(function() {
        nininit();
        window.setInterval(function(){
            ninhanceStats();
        }, 100);
    });

})();