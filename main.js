// ==UserScript==
// @name         Youtube-Community-Post-Notification
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Youtube Community Posts
// @author       freshLiver
// @match        https://www.youtube.com
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @grant        GM_notification
// @require      https://code.jquery.com/jquery-latest.min.js
// ==/UserScript==

const yt_base_url = "https://www.youtube.com";


function get_channel_community_posts(channel_id) {

    // send sync http get request and get resp text(data)
    let community_posts = null;
    $.ajax({
        async: false,
        type: 'GET',
        url: `${yt_base_url}/channel/${channel_id}/community`,
        success: function (data) {

            // add resp text into a new element for parsing
            const result_element = $(`<div>${data}</div>`);

            // get content script from result element and extract json data
            const content = result_element.find("link[rel=canonical]").prev(),
                data_begin = content.text().search("="),
                data_end = content.text().lastIndexOf(";"),
                channel_data = JSON.parse(content.text().slice(data_begin + 1, data_end));

            // extract community data
            let community = null;
            for (const tab of channel_data.contents.twoColumnBrowseResultsRenderer.tabs) {
                if (tab.tabRenderer.title === '社群') {
                    community = tab.tabRenderer;
                    break;
                }
            }

            // extract post list from community data and get latest post
            community_posts = community.content.sectionListRenderer.contents[0].itemSectionRenderer.contents;
        }
    });
    return community_posts;
}

function notify(channel_id, postData) {

    // get info from post data
    const postInfo = postData.backstagePostThreadRenderer.post.backstagePostRenderer;
    const postVideo = postInfo.backstageAttachment.videoRenderer;

    // post info
    const info = {
        "channel": {
            name: postInfo.authorText.runs[0].text,
            thumbnail: `https:${postInfo.authorThumbnail.thumbnails.pop().url}`
        },
        "content": {
            "text": postInfo?.contentText.runs.map((value) => value.text).join('\n'),
            "videoInfo": {
                title: postVideo?.title.runs[0].text || undefined,
                id: postVideo?.videoId,
                thumbnail: postVideo?.thumbnail.thumbnails.pop().url,
                link: postVideo ? `https://youtu.be/${postVideo.videoId}` : undefined
            }
        },
        "id": postInfo.postId,
        "time": postInfo.publishedTimeText.runs[0].text,
        "link": `${yt_base_url}/channel/${channel_id}/community?lb=${postInfo.postId}`,
    };

    // convert info to notification data
    const notification = {
        title: `${info.channel.name} - (${info.time}) - ${info.content.videoInfo.title || ""}`,
        text: info.content.text,
        image: info.content.videoInfo.thumbnail || info.channel.thumbnail,
        highlight: true,
        silent: true,
        timeout: 5,
        onclick: () => {
            // if no video, open post page and focus to it
            const newWin = window.open(info.content.videoInfo.link || info.link);
            newWin.focus();
        }
    };

    // send notification
    GM_notification(notification);
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

        // get post info
        notify(channel_id, post_list[1]);
    }

    alert("resp done.");
})();