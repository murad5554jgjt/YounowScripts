// ==UserScript==
// @name         Pelinka Queue System
// @namespace    https://streamnow.pro
// @version      0.1
// @description  A queue system I use for the pelinka games
// @author       Lazzeri
// @match        https://www.younow.com/*
// @grant        none
// @run-at       document-start
// @noframes
// ==/UserScript==

(async function ()
{
    'use strict';
    //Both initiated in the beginning
    let broadcasterUserId;
    let broadcasterBroadcastId;
    let local;
    const userName = '123FreshLikeMe';
    let giftQueue = [];

    //Helper Functions ---------------------------------------------------
    function sleep(milliseconds)
    {
        if (milliseconds < 0)
            return new Promise(resolve =>
            {
                resolve()
            })

        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    //Normal Functions ---------------------------------------------------
    const addBlockedUserToLocalStorage = (userId) =>
    {
        let oldItem = localStorage.getItem('blockedUsers');

        //If it's not set at all update
        if (!oldItem)
        {
            localStorage.setItem('blockedUsers', JSON.stringify([userId]));
            return;
        }

        let oldArray = JSON.parse(oldItem);

        localStorage.setItem('blockedUsers', JSON.stringify([...oldArray, userId]));
    }

    const removeBlockedUserFromLocalStorage = (userId) =>
    {
        let oldItem = JSON.parse(localStorage.getItem('blockedUsers'));
        const filteredItem = oldItem.filter((elem) =>
        {
            return userId !== elem
        });

        localStorage.setItem('blockedUsers', JSON.stringify(filteredItem));

    }

    function getUserInfo(userName)
    {
        return new Promise((resolve) =>
        {
            fetch("https://api.younow.com/php/api/broadcast/info/curId=0/user=" + userName).then(response => response.json()).then((broadcastInfo) =>
            {
                return resolve(broadcastInfo);
            });
        });
    }

    const sendMessage = (text) =>
    {
        fetch("//api.younow.com/php/api/broadcast/chat", {
            "headers": {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "x-requested-by": localStorage.getItem("requestBy")
            },
            "body": "userId=" + broadcasterUserId + "&channelId=" + broadcasterUserId + "&comment=" + text + "&tsi=qTARYFhKsb&tdi=tV16GrJcrS&lang=" + local,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
    }

    const blockUser = (targetUserId) =>
    {
        addBlockedUserToLocalStorage(targetUserId);
        fetch("//api.younow.com/php/api/doAdminAction", {
            "headers": {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "x-requested-by": localStorage.getItem("requestBy")
            },
            "body": "actionId=" + 281474976710656 + "&userId=" + broadcasterUserId + "&onUserId=" + targetUserId + "&tsi=FXm2qPfg0D&tdi=yt12B0GFdq&lang=" + local,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
    }

    const unblockUser = (targetUserId) =>
    {
        removeBlockedUserFromLocalStorage(targetUserId);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.younow.com/php/api/doAdminAction");
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        xhr.setRequestHeader("X-Requested-By", localStorage.getItem("requestBy"));
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.withCredentials = true;

        xhr.send("actionId=" + 562949953421312 + "&userId=" + broadcasterUserId + "&onUserId=" + targetUserId + "&tsi=FXm2qPfg0D&tdi=yt12B0GFdq&broadcaster=0&lang=" + local + "&comment=autoBan&broadcastId=" + broadcasterBroadcastId);
    }

    const setupPusher = (giftCallback) =>
    {
        const installPusherLibrary = () =>
        {
            return new Promise(async resolve =>
            {
                console.log('Installing Pusher Library')
                let head = document.getElementsByTagName('head')[0];
                let link = document.createElement('script');
                link.src = 'https://js.pusher.com/7.0/pusher.min.js';
                head.appendChild(link);
                await sleep(2000);
                return resolve();
            })
        }

        const connectToWebsocket = (callBack) =>
        {
            console.log('Connecting to websocket');
            let pusher = new Pusher('d5b7447226fc2cd78dbb', {
                cluster: "younow"
            });
            let channel = pusher.subscribe("public-channel_" + broadcasterUserId);

            channel.bind('onChat', function (data)
            {
                let comment = data.message.comments[0];
                callBack(comment);
            });


            channel.bind('onGift', function (data)
            {
                for (let i = 0; i < data.message.stageGifts.length; i++)
                {
                    let obj = data.message.stageGifts[i];
                    switch (obj.giftId)
                    {
                        case 1178:
                            obj.type = 'pearlsTipJarPlinko'
                            break;
                        case 1065:
                            obj.type = 'pearlsTipJar'
                            break;
                        default:
                            obj.type = 'notNeeded'
                    }
                    callBack(obj);
                }
            });
        }

        installPusherLibrary().then(() => connectToWebsocket(giftCallback));
        return 'Done';
    }


    //MAIN ----------------------------------------------------
    async function runCode()
    {
        let {userId, broadcastId, locale} = await getUserInfo(userName);
        broadcasterBroadcastId = broadcastId;
        broadcasterUserId = userId;
        local = locale;

        sendMessage('Test');

        setupPusher(async (data) =>
        {
            blockUser(data.userId);
            await sleep(2000);
            unblockUser(data.userId);

        })
    }

    runCode();

})();
