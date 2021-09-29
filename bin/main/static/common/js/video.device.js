const videoDevice = (function() {
    let audioDeviceId = '';
    let videoDeviceId = '';
    let isBroadCasting = false;

    return {
        /**
         * 비디오 및 오디오 출력 장치 리스트 리턴
         * @param devices
         * @returns {{videoInputs: [], audioInputs: [], audioOutputs: []}}
         */
        getDeviceList: function(devices) {
            const audioInputs   = [];
            const audioOutputs  = [];
            const videoInputs   = [];

            devices.forEach(function(device) {
                //console.log(device);

                const label = device.label ?? device.deviceId;
                const id    = device.deviceId;
                const kind  = device.kind;

                if (kind === 'audioinput') {
                    audioInputs.push({id: id, label: label});
                } else if (kind === 'audiooutput') {
                    audioOutputs.push({id: id, label: label});
                } else if (kind === 'videoinput') {
                    videoInputs.push({id: id, label: label});
                }
            });

            const deviceInfos = {
                audioInputs: audioInputs,
                audioOutputs: audioOutputs,
                videoInputs: videoInputs
            };

            return deviceInfos;
        },
        /**
         * 비디오 및 오디오 출력 장치 변경 수행
         * @param pluginHandler
         * @param audioInput
         * @param videoInput
         * @param callback
         */
        settingDevice: function(pluginHandler, audioInput, videoInput, callback) {
            const body = { "request": "configure","audio": true, "video": true };
            pluginHandler.send({ "message": body });

            const replaceAudio = audioInput !== audioDeviceId;
            audioDeviceId = audioInput;

            const replaceVideo = videoInput !== videoDeviceId;
            videoDeviceId = videoInput;

            pluginHandler.createOffer({
                media: {
                    audio: {
                        deviceId: {
                            exact: audioDeviceId
                        }
                    },
                    replaceAudio: replaceAudio,
                    video: {
                        deviceId: {
                            exact: videoDeviceId
                        }
                    },
                    replaceVideo: replaceVideo,
                    data: true
                },
                success: function(jsep) {
                    // console.log('setting video device success');
                    // console.log(jsep);
                    pluginHandler.send({"message": body, "jsep": jsep});
                    if (!isBroadCasting) {
                        callback();
                        isBroadCasting = true;
                    }
                },
                error: function(error) {
                    //console.error(`setting video device error: ${error}`);
                }
            });
        },
        /**
         * Video 해상도 체크 후 품질 상태 리턴
         * @param width
         * @param height
         * @returns {string}
         */
        getVideoQuality: function(width, height) {
            if (width >= 0 && width < 176)      return 'QQVGA';
            if (width >= 176 && width < 320)    if (height >= 144) { return 'QCIF'; } else { return 'QQVGA'; }
            if (width >= 320 && width < 352)    if (height >= 240) { return 'QVGA'; } else { return 'QCIF'; }
            if (width >= 352 && width < 640)    if (height >= 288) { return 'CIF'; }  else { return 'QVGA'; }
            if (width >= 640 && width < 800) {
                                                if (height >= 360 && height < 480) { return '360p(nHD)'; } else { return 'CIF'; }
                                                if (height >= 480)                 { return 'VGA'; }       else { return '360p(nHD)'; }
                                             }
            if (width >= 800 && width < 1280)  if (height >= 600)  { return 'SVGA'; }       else { return 'VGA'; }
            if (width >= 1280 && width < 1600) if (height >= 720)  { return '720p(HD)'; }   else { return 'SVGA'; }
            if (width >= 1600 && width < 1920) if (height >= 1200) { return 'UXGA'; }       else { return '720p(HD)'; }
            if (width >= 1920 && width < 3840) if (height >= 1080) { return '1080p(FHD)'; } else { return 'UXGA'; }
            if (width >= 3840)                 if (height >= 2160) { return '4K(UHD)'; }    else { return '1080p(FHD)'; }
            return 'QQVGA';
        },
        /**
         * 사용자 오디오 출력 장치 설정 및 음소거
         * @param pluginHandler
         * @param event
         */
        toggleDeviceAudio: function(pluginHandler, event) {
            if (pluginHandler) {
                if(event == "ON") {
                    pluginHandler.unmuteAudio();
                } else {
                    pluginHandler.muteAudio();
                }
                // const status = event === 'ON' ? true : false;
                // const body = { "request": "configure", "audio": status, "video": true };
                // pluginHandler.send({ "message": body });
            }
		},
        /**
         * 비디오 및 오디오 변경 (장비) 버튼 노출
         * @param target
         */
        toggleDeviceSetting: function(target) {
            document.querySelector(`.${target}`).style.display = 'block';
        }
    }
})();