import {Router} from 'express';
import * as Path from 'path';

const www: Router = Router();

www.get('/', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'index.html'));
});

www.get('/offers', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'index.html'));
});

www.get('/messages', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'index.html'));
});

www.get('/trades', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'index.html'));
});

www.get('/trades/:to', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'index.html'));
});

www.get('/burn', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'index.html'));
});

www.get('/messages/:to', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'index.html'));
});

www.get('/profile', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'index.html'));
});

www.get('/index.html', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'index.html'));
});

www.get('/app.js', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'app.js'));
});

www.get('/styles.css', (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'styles.css'));
});

www.get('/images/:image' , (req, res) => {
    res.sendFile(Path.join(__dirname, '..', 'www', 'images', req.params.image));
});

export default www;
