// ==UserScript==
// @name         SSAH Ledger Downloader
// @namespace    https://auctionhouse.club
// @version      0.1.2
// @description  Adds CSV Download Button
// @author       Ninshubur /|\(♥.♥)/|\
// @match        https://auctionhouse.club/history
// @grant        none
// @downloadURL  https://pastebin.com/raw/1fDFQxib
// ==/UserScript==

(function() {

    jQuery.fn.table2CSV = function(options) {
        options = jQuery.extend({
            separator: ',',
            header: [],
            headerSelector: 'th',
            columnSelector: 'td',
            delivery: 'popup', // popup, value, download
            filename: 'auctionhouse_ledger.csv', // filename to download
            transform_gt_lt: true // make &gt; and &lt; to > and <
        },
                                options);

        var csvData = [];
        var headerArr = [];
        var el = this;
        let quotes = ['"', '"'];

        //header
        var numCols = options.header.length;
        var tmpRow = []; // construct header avalible array

        if (numCols > 0) {
            for (var i = 0; i < numCols; i++) {
                tmpRow[tmpRow.length] = formatData(options.header[i]);
            }
        } else {
            $(el).filter(':visible').find(options.headerSelector).each(function() {
                if ($(this).css('display') != 'none') tmpRow[tmpRow.length] = formatData($(this).html());
            });
            tmpRow[tmpRow.length] = 'Time';
            if(tmpRow[0] == '') { tmpRow[0] = 'ID'; }
        }

        row2CSV(tmpRow);

        // actual data
        $(el).find('tr').each(function() {
            var tmpRow = [];
            $(this).filter(':visible').find(options.columnSelector).each(function() {
                if ($(this).css('display') != 'none') {
                    let cell = formatData($(this).html());
                    if(typeof cell == 'string') {
                        tmpRow[tmpRow.length] = cell;
                    } else {
                        tmpRow[tmpRow.length] = cell[0];
                        tmpRow[tmpRow.length] = cell[1];
                    }
                }
            });
            row2CSV(tmpRow);
        });
        if (options.delivery == 'popup') {
            let mydata = csvData.join('\n');
            if(options.transform_gt_lt){
                mydata=sinri_recover_gt_and_lt(mydata);
            }
            return popup(mydata);
        }
        else if(options.delivery == 'download') {
            let mydata = csvData.join('\n');
            if(options.transform_gt_lt){
                mydata=sinri_recover_gt_and_lt(mydata);
            }
            var url='data:text/csv;charset=utf8,' + encodeURIComponent(mydata);
            window.open(url);
            return true;
        }
        else {
            let mydata = csvData.join('\n');
            if(options.transform_gt_lt){
                mydata=sinri_recover_gt_and_lt(mydata);
            }
            return mydata;
        }

        function sinri_recover_gt_and_lt(input){
            let regexp=new RegExp(/&gt;/g);
            input=input.replace(regexp,'>');
            regexp=new RegExp(/&lt;/g);
            input=input.replace(regexp,'<');
            return input;
        }

        function row2CSV(tmpRow) {
            var tmp = tmpRow.join('') // to remove any blank rows
            // alert(tmp);
            if (tmpRow.length > 0 && tmp != '') {
                var mystr = tmpRow.join(options.separator);
                csvData[csvData.length] = mystr;
            }
        }
        function formatData(input) {
            if(input.includes('slave_history_image')) {
                let image = input.trim().split(' ')[1].split('/').pop().split('.')[0];
                return '"' + image + '"';
            }
            // double " according to rfc4180
            let regexp = new RegExp(/["]/g);
            let output = input.replace(regexp, '""');
            //HTML
            regexp = new RegExp(/\<[^\<]+\>/g);
            output = output.replace(regexp, "");
            output = output.replace(/&nbsp;/gi,' '); //replace &nbsp;
            if (output.trim() == "") {
                if(input.includes('text-default')) { return '"Auction House"'; }
                return '';
            }
            let regexp_time = new RegExp(/\b([0-9]+:[0-9]{2}.[AP]M).+\b(\w+.\b[0-9]+).+(2019)/);
            if(output.match(regexp_time)) {
                let match_result = output.match(regexp_time)
                let date = match_result[2] + ', ' +  match_result[3];
                let time = match_result[1];
                return [quotes.join(date), quotes.join(time)];
            }
            return '"' + output.trim() + '"';
        }
        function popup(data) {
            var generator = window.open('', 'csv', 'height=400,width=600');
            generator.document.write('<html><head><title>CSV</title>');
            generator.document.write('</head><body >');
            generator.document.write('<textArea cols=70 rows=15 wrap="off" >');
            generator.document.write(data);
            generator.document.write('</textArea>');
            generator.document.write('</body></html>');
            generator.document.close();
            return true;
        }
    };

    function nindownloadLedger() {
        $('table').each(function () {
            var $table = $(this);

            var link = document.createElement('a');
            let today = new Date();
            let filename = 'SSAH Ledger ' + user.username + ' ' + today.toDateString().slice(4) + '.csv';
            link.download = filename;
            var csv = $table.table2CSV({
                delivery: 'value'
            });
            link.href = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(csv);
            link.click();
        });
    };

    function ninaddbutton() {
        let ah_return_link = document.querySelector('a[href="https://auctionhouse.club/"]');
        let newButton = document.createElement('button');
        newButton.innerHTML = 'Download to CSV';
        newButton.onclick = nindownloadLedger;
        ah_return_link.insertAdjacentElement("afterend", newButton);

    };

    $(document).ready(function () {
        ninaddbutton();
    });
})();