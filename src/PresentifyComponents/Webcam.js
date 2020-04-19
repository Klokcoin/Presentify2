import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components/macro";

import { Loading } from "../Components/LoadingSpinner";
import { Center, Layer } from "../Elements";

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

export const Webcam = (props) => {
  const { deviceId } = props;

  let [isPlaying, set_isPlaying] = useState(false);
  let [stream, set_stream] = useState(null);

  //   updating webcam
  useEffect(() => {
    if (deviceId) {
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
          set_stream(stream);
        });
    }
  }, [deviceId]);

  return (
    <Container>
      {deviceId ? (
        <>
          <video
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            ref={(videoEl) => {
              if (
                videoEl != null &&
                stream != null &&
                videoEl.srcObject !== stream
              ) {
                videoEl.srcObject = stream;
                videoEl.play();
              }
            }}
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

  useEffect(() => {
    // to get cameraId!!
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      let newDevices = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => {
          let { deviceId, label } = device;
          return { deviceId, label };
        });

      set_videoDevices(newDevices);
    });
  }, []);

  let handle_select = (e) => {
    set_selectedValue(e.target.value);
    if (e.target.value) {
      onChange(selectedValue);
    }
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
