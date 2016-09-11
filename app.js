'use strict';

const credentials = require(__dirname + '/credentials.json');
const oauth_token = credentials.oauth_token;
const client_id = credentials.client_id;

//https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=hz8wo4rc95k7ed6c91qbqe33ofo6lo2&redirect_uri=http://localhost&scope=user_read+user_blocks_edit+user_blocks_read+user_follows_edit+channel_read+channel_editor+channel_commercial+channel_stream+channel_subscriptions+user_subscriptions+channel_check_subscription+chat_login+channel_feed_read+channel_feed_edit

const bodyParser = require('body-parser');
const request = require('request');
const express = require('express');
const app = express();

const api_url = 'https://api.twitch.tv/kraken';

const jsonParser = bodyParser.json();

// TODO: add dynamic oauth_token for channels

// followage
app.get('/follow/:channel/:user/', (req, res) => {
    request.get({ url: api_url + `/users/${req.params.user}/follows/channels/${req.params.channel}` + oauth_token, qs: { oauth_token: oauth_token, client_id: client_id }, json: true }, (err, response, body) => {
        const date = new Date(body['created_at']);
        res.end(DDHHMM(new Date() - date));
    });
});

// uptime
app.get('/uptime/:channel/', (req, res) => {
    request.get({ url: api_url + `/streams/${req.params.channel}`, qs: { oauth_token: oauth_token, client_id: client_id }, json: true }, (err, response, body) => {
        if (body['stream'] == undefined) {
            res.end('channel is not live');
        } else {
            const date = new Date(body['stream']['created_at']);
            res.end(DDHHMM(new Date() - date));
        }
    });
});

// game
app.get('/game/:channel', (req, res) => {
    request.get({ url: api_url + `/channels/${req.params.channel}`, qs: { oauth_token: oauth_token, client_id: client_id }, json: true }, (err, response, body) => {
        res.end(body['game']);
    });
});

app.put('/game/:channel', (req, res) => {
    resquest.get({})
});

// get title
app.get('/title/:channel/', (req, res) => {
    request.get({ url: api_url + `/channels/${req.params.channel}`, qs: { oauth_token: oauth_token, client_id: client_id }, json: true }, (err, response, body) => {
        res.end(body['status']);
    });
});

// change title
app.put('/title/:channel/', jsonParser, (req, res) => {
    request.put({ url: api_url + `/channels/${req.params.channel}`, qs: { oauth_token: oauth_token, client_id: client_id }, json: { channel: { status: `${req.body.channel.status}` } } }, (err, response, body) => {
        res.end();
    });
});

// get display_name
app.get('/name/:channel/', (req, res) => {
    request.get({ url: api_url + `/channels/${req.params.channel}`, qs: { oauth_token: oauth_token, client_id: client_id }, json: true }, (err, response, body) => {
        res.end(body['display_name']);
    });
});

app.listen(3030, () => {
    console.log("listening at *:3030");
});

function DDHHMM(diff) {
    const ss = Math.floor(diff / 1000);
    const mm = Math.floor(diff / (60 * 1000) % 60);
    const hh = Math.floor(diff / (60 * 60 * 1000) % 24);
    const dd = Math.floor(diff / (24 * 60 * 60 * 1000));
    console.log(hh, mm)
    const date = [];
    if (dd > 0) date.push(dd + (dd > 1 ? ' days' : ' day'));
    if (hh > 0) date.push(hh + (hh > 1 ? ' hours' : ' hour'));
    if (mm > 0) date.push(mm + (mm > 1 ? ' minutes' : ' minute'));
    return date.join(', ')
}

require(__dirname + '/bot.js');