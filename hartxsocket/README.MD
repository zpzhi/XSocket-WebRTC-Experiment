These codes are experiment of using Hark + Xsocket to detect which remote stream is speaking. Speaking remote video stream
will be enlarged.

The simple steps would be:

1. Attach local video stream to Hark speech detecter
2. Get the result if speak or not.
3. Publish the result+streamId using xsocket to all peers.
4. Subscribe the result in all peers.
5. Compare the streamId to see if which remote stream is speaking
6. Enlarge that stream when found it speaking, and restore it to normal size when not speaking.
