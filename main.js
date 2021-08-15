// ==UserScript==
// @name         Youtube-Community-Post-Notification
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Youtube Community Posts
// @author       freshLiver
// @match        https://holodex.net/*
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-latest.min.js
// @connect      www.youtube.com
// ==/UserScript==

const msCheckInterval = 1000 * 60;
const msNotificationDuration = 1000 * 5;
const maxNotificationRepeats = 3;

const noNotificationAfterClicked = true;
const openPostAfterMaxRepeat = true;
const disableNotificationSound = false;
const enableNotificationHighlightTab = true;

const channel_id_list = [
    "UC-hM6YJuNYVAmUWxeIr9FeA",
    "UCXTpFs_3PqI41qX2d9tL2Rw"
];


function notify(channel_id, postData) {

    // get info from post data
    const rawPostInfo = postData.backstagePostThreadRenderer.post.backstagePostRenderer;
    const postVideo = rawPostInfo.backstageAttachment?.videoRenderer;

    // post info
    const postInfo = {
        "channel": {
            name: rawPostInfo.authorText.runs[0].text,
            thumbnail: `https:${rawPostInfo.authorThumbnail.thumbnails.pop().url}`
        },
        "content": {
            "text": rawPostInfo?.contentText.runs.map((value) => value.text).join('\n'),
            "videoInfo": {
                title: postVideo?.title.runs[0].text || undefined,
                id: postVideo?.videoId,
                thumbnail: postVideo?.thumbnail.thumbnails.pop().url,
                link: postVideo ? `https://youtu.be/${postVideo.videoId}` : undefined
            }
        },
        "id": rawPostInfo.postId,
        "time": rawPostInfo.publishedTimeText.runs[0].text,
        "link": `https://www.youtube.com/channel/${channel_id}/community?lb=${rawPostInfo.postId}`,
    };

    // Use LocalStorage(key, value) to Check Post Status(PostId, {RepeatTimes: num, Checked: bool})
    let status;
    try {
        // parse status 
        status = JSON.parse(window.localStorage.getItem(postInfo.id)) || { repeats: 0, checked: false };
    } catch (error) {
        // set default value if 
        status = { repeats: 0, checked: false };
        console.log(`${postInfo.link} status parse error, reset status.`);
    }

    // convert info to notification data
    const notification = {
        title: `${postInfo.time} - ${postInfo.channel.name} ${postInfo.content.videoInfo.title || ""}`,
        text: postInfo.content.text,
        image: postInfo.content.videoInfo.thumbnail || postInfo.channel.thumbnail,
        highlight: enableNotificationHighlightTab,
        silent: disableNotificationSound,
        timeout: msNotificationDuration,
        onclick: () => {
            // set post checked and open video or post page
            status.checked = true;
            console.log(`${postInfo.link} status.checked = true.`);
            window.open(postInfo.content.videoInfo.link || postInfo.link).focus();
        }
    };

    // check repeats if 'not opened yet' or 'noNotificationAfterClicked not set'
    if (!noNotificationAfterClicked || !status.checked)
        // send if repeat times < MaxRepeatTimes
        if (status.repeats < maxNotificationRepeats)
            GM_notification(notification, () => {
                // FIXME : increase repeat times and update status
                console.log(`${postInfo.link} status.repeats = ${++status.repeats}.`);
                window.localStorage.setItem(postInfo.id, JSON.stringify(status));
            });
}

function get_channel_community_posts(channel_id) {

    // send cors http get request and get resp text(data)
    GM_xmlhttpRequest({
        url: `https://www.youtube.com/channel/${channel_id}/community`,
        method: 'GET',
        responseType: 'text/html',
        onload: (arg) => {
            if (arg.status != 200)
                alert(arg.statusText);
            else {
                // add resp text into a new element for parsing
                const result_element = $(`<div>${arg.responseText}</div>`);

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
                const community_posts = community.content.sectionListRenderer.contents[0].itemSectionRenderer.contents;

                // send notification
                notify(channel_id, community_posts[0]);
            }
        }
    });
}

(function () {
    'use strict';

    // set repeat interval (in ms)
    window.setInterval(() => {
        for (const channel_id of channel_id_list)
            get_channel_community_posts(channel_id);
    }, msCheckInterval);

})();