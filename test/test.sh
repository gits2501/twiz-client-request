#!/bin/bash

                                
Xvfb :1 -screen 5 1024x768x8 &   # Start virtual framebuffer display
export DISPLAY=:1.5

npm run server;                  # Start mock server (node)
 
npm run test-browser;            # Test browser code against server mock
