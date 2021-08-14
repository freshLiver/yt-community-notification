// ==UserScript==
// @name         Youtube-Community-Post-Nitification
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Youtube Community Posts
// @author       freshLiver
// @match        https://www.youtube.com
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @grant        none
// @require      https://code.jquery.com/jquery-latest.min.js
// ==/UserScript==

const yt_base_url = "https://www.youtube.com";

function get_channel_community_posts(channel_id) {

    // send http get request to target channel and get resp text
    const resp = $.get(`${yt_base_url}/channel/${channel_id}/community`);

    if (resp.status == 200) {

        // add resp text into a new element for parsing
        const result_element = $(`<div>${resp.responseText}</div>`);

        // get content script from result element and extract json data
        const content = result_element.find("link[rel=canonical]").prev(),
            data_begin = content.text().search("="),
            data_end = content.text().lastIndexOf(";"),
            data = JSON.parse(content.text().slice(data_begin + 1, data_end));

        // extract community data
        let community = null;
        for (const tab of data.contents.twoColumnBrowseResultsRenderer.tabs) {
            if (tab.tabRenderer.title === '社群') {
                community = tab.tabRenderer;
                break;
            }
        }

        // extract post list from community data and get latest post
        return community.content.sectionListRenderer.contents[0].itemSectionRenderer.contents;
    }
    console.log(`${resp.status} : ${resp.text}`);
}

(function () {
    'use strict';

    // check each channel's community post
    const channel_id_list = [
        "UCXTpFs_3PqI41qX2d9tL2Rw",
    ];

    for (const channel_id of channel_id_list) {

        // get community posts of this channel
        const post_list = get_channel_community_posts(channel_id);

        // check latest post 
        const latest_post = post_list[1];
        const latest_post_id = latest_post.backstagePostThreadRenderer.post.backstagePostRenderer.postId;
        const latest_post_link = `${yt_base_url}/${channel_community_path}?lb=${latest_post_id}`;

        console.log(latest_post);
        console.log(latest_post_id);

        confirm(latest_post_link);

    }

    alert("resp done.");
})();