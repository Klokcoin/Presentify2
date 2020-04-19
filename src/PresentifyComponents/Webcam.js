import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";

import { Loading } from "../Components/LoadingSpinner";
import { Center, Layer } from "../Elements";

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

export const Webcam = (props) => {
  const { deviceId } = props;

  console.log("optioms", deviceId, props.options);

  const videoEl = useRef(null);
  let [isPlaying, set_isPlaying] = useState(false);

  function initCamera() {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          deviceId: {
            exact: deviceId,
          },
        },
        audio: false,
      })
      .then((stream) => {
        let video = videoEl.current;
        video.srcObject = stream;
        video.play();
      })
      .catch((error) => {
        console.error("onRejected function called: " + error.message);
      });
  }

  //   updating webcam
  useEffect(() => {
    if (deviceId) initCamera();
  }, [deviceId]);

  return (
    <Container>
      {deviceId ? (
        <>
          <video
            width={"100%"}
            height={"100%"}
            ref={videoEl}
            onPlay={() => set_isPlaying(true)}
            allow="camera"
          />
          {!isPlaying && (
            <Layer>
              <Center>
                <Loading />
              </Center>
            </Layer>
          )}
        </>
      ) : (
        <div>Please select a video device</div>
      )}
    </Container>
  );
};

export const SelectVideoDevice = ({ value, onChange }) => {
  let [videoDevices, set_videoDevices] = useState([]);
  let [selectedValue, set_selectedValue] = useState(null);
  console.log("props", value);

  useEffect(() => {
    // to get cameraId!!
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      let newDevices = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => {
          console.log("device_id:", device);
          let { deviceId, label } = device;
          return { deviceId, label };
        });

      set_videoDevices(newDevices);
    });
  }, []);

  useEffect(() => {
    if (selectedValue) onChange(selectedValue);
  }, [selectedValue]);

  let handle_select = (e) => {
    set_selectedValue(e.target.value);
  };

  return (
    <div>
      <h4> select video device: </h4>
      <select value={selectedValue} onChange={handle_select}>
        {!selectedValue && (
          <option selected disabled>
            Select an input device
          </option>
        )}
        {videoDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
};
