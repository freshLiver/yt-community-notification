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

(function() {
    'use strict';

    const yt_base_url = "https://www.youtube.com/";

    const target_channels = [
        "UCXTpFs_3PqI41qX2d9tL2Rw",
    ];

    // check each channel's community post
    for ( const channel_id of target_channels ) {

        // send http get request to target channel and get resp text
        const channel_community_path = `channel/${channel_id}/community`;
        $.get(`${yt_base_url}/${channel_community_path}`).done( (resp_text) => {

            // add resp text into a new element for parsing
            const result_element = $(`<div>${resp_text}</div>`);

            // get content script from result element and extract json data
            const content = result_element.find("link[rel=canonical]").prev();
            const data_begin = content.text().search("="),
                  data_end = content.text().lastIndexOf(";"),
                  data = JSON.parse(content.text().slice(data_begin+1, data_end));

            // extract community data
            let community = null;
            for (const tab of data.contents.twoColumnBrowseResultsRenderer.tabs) {
                if (tab.tabRenderer.title === '社群' ){
                    community = tab.tabRenderer;
                    break;
                }
            }

            // extract post list from community data and get latest post
            const post_list = community.content.sectionListRenderer.contents[0].itemSectionRenderer.contents;

            const latest_post = post_list[1];
            const latest_post_id = latest_post.backstagePostThreadRenderer.post.backstagePostRenderer.postId;
            const latest_post_link = `${yt_base_url}/${channel_community_path}?lb=${latest_post_id}`;

            console.log(latest_post);
            console.log(latest_post_id);

            confirm(latest_post_link);

        });
    }

    alert("resp done.");
})();