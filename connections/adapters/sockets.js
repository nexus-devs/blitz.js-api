"use strict"


/**
 * Socket requirements
 */
const io = require("socket.io")


/**
 * Middleware helpers
 */
const converter = require("../../middleware/socketParser.js")
const Layer = require("../layers.js")


/**
 * Request Controller
 */
const Request = require("../../controllers/request.js")


/**
 * Handles all I/O for Socket.io
 */
class SocketAdapter {

    /**
     * Constructs Socket
     */
    constructor(server) {

        // Create empty middleware stack
        this.stack = []

        // Listen on server
        this.io = io.listen(server)

        // Bind Request Controller to object
        this.request = new Request(this)

        // Create root namespace
        this.root = this.io.of("/root")
    }


    /**
     * Run middleware before passing to ReqController
     */
    prepass(socket, verb, request, ack) {

        // Modify req/res object to allow same middleware approach as in express
        let req = converter.convertReq(request, socket, verb)
        let res = converter.convertRes(socket, ack)
        let layer = new Layer

        layer.runStack(req, res, this.stack)
            .then(() => this.pass(req, res))
            .catch(() => {})
    }


    /**
     * Passes request to RequestController
     */
    pass(req, res) {
        this.request.getResponse(req)
        .then(response => res.status(response.statusCode).send(response.body))
    }


    /**
     * Adds functions to queue that are processed before this.pass() gets called
     */
    use(route, fn, verb) {
        let middleware = {
            method: verb ? verb : "ANY",
            route: typeof route === "string" ? route : "*", // check if includes. Maybe need reverse order for reading?
            fn: typeof fn === "function" ? fn : route
        }
        this.stack.unshift(middleware)
    }
}

module.exports = SocketAdapter
