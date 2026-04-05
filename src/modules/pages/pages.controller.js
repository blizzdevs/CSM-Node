'use strict';

const ServerInfoService = require('../serverinfo/serverinfo.service');

const PagesController = {
    // ── Páginas Legales / Informativas ──
    showTerms(req, res) {
        res.render('pages/static/tos', { title: 'Terms of Service | NodeEngine' });
    },
    
    showPrivacy(req, res) {
        res.render('pages/static/privacy', { title: 'Privacy Policy | NodeEngine' });
    },
    
    showRefunds(req, res) {
        res.render('pages/static/refunds', { title: 'Refund Policy | NodeEngine' });
    },

    // ── Server Info Especial (como WebEngine /info) ──
    showInfo(req, res) {
        // Obtenemos los stats en vivo usando el cache de ServerInfoService
        const serverInfo = ServerInfoService.getServerInfo() || {};
        res.render('pages/static/info', { 
            title: 'Server Information | NodeEngine',
            serverInfo
        });
    },

    // ── Contacto (Simulado) ──
    showContact(req, res) {
        const generateToken = req.app.get('generateCsrfToken');
        const csrfToken = generateToken(req, res);
        res.render('pages/static/contact', { 
            title: 'Contact Us | NodeEngine',
            csrfToken,
            flashSuccess: req.flash('success'),
            flashError: req.flash('error')
        });
    },

    processContact(req, res) {
        // Simulación: Validamos inputs pero en realidad no enviamos correo (similar a la config vacía)
        const { subject, email, message } = req.body;
        
        if (!subject || !email || !message) {
            req.flash('error', 'Please fill all required fields.');
            return res.redirect('/contact');
        }

        req.flash('success', 'Your message has been sent successfully. We will contact you soon.');
        res.redirect('/contact');
    }
};

module.exports = PagesController;
