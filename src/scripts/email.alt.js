/* globals Mn, Backbone, $, _, Backbone */
(function() {
'use strict';

// //////////
// Models and collections
// //////////
var EmailModel = Backbone.Model.extend({
	defaults: {
		'primary': false,
		'valid': false,
		'emailSent': false
	}
});

var EmailCollection = Backbone.Collection.extend({
	model: EmailModel,
    comparator: function(item) {
    	var primary = item.get('primary') ? 1 : 10,
    	    valid = item.get('valid') ? 1 : 5;
    	return primary + valid;
    }
});


// //////////
// Views
// //////////
var EmailAdd = Mn.ItemView.extend({
	template: '#add-email',
	ui: {
		'email': '#email',
		'submit': '#submit'
	},
	events: {
		'click @ui.submit': 'onSubmit'
	},
	onSubmit: function() {

		var emailModel = new EmailModel();
		emailModel.set('email', this.ui.email.val());
		Backbone.Radio.channel('default').trigger('add:collection', emailModel);
	}
});

var NoEmailsView = Mn.ItemView.extend({
	template: '#no-emails'
});

var EmailElement = Mn.ItemView.extend({
    initialize: function() {
        var self = this;

        Backbone.Radio.channel('default').on('unset:primary:email', function() {
            var isPrimary = self.model.get('primary');
            if (isPrimary) {
                self.model.set('primary', false);
            }
        });
    },
    template: '#email-element',
    el : '<tr>',
    events: {
        'click @ui.remove': 'removeEmail',
        'click @ui.cancel': 'cancelRemoveEmail',
        'click @ui.accept': 'acceptRemoveEmail',
        'click @ui.alternative': 'setAsPrimaryEmail',
        'click @ui.sendConfirmation': 'sendConfirmationEmail'
    },
    ui: {
        primary: '.primary-email',
        alternative: '.alternative-email',

        sendConfirmation: '.send-email',
        sending: '.sending-confirmation',
        verified: '.verified-email',
        remove: '.email-remove',
        confirm: '#confirm',
        cancel: '.cancel',
        accept: '.accept'
    },
    removeEmail: function(evt) {
        evt.preventDefault();
        this.destroy();
    },
    setAsPrimaryEmail: function() {
        Backbone.Radio.channel('default').trigger('unset:primary:email');
		this.model.set('primary', true);
        Backbone.Radio.channel('default').trigger('collection:render');
    },
    onRender: function() {
        var isPrimary = this.model.get('primary');

        if (isPrimary) {
            this._showPrimary();
        } else {
           this._showAlternative();
           this._showRemove();
        }
    },
    _showPrimary: function() {
        this.ui.primary.removeClass('hidden');
    },
    _showAlternative: function() {
        this.ui.alternative.removeClass('hidden');
    },
    _showRemove: function() {
        this.ui.remove.removeClass('hidden');
    }
});

var EmailList = Mn.CompositeView.extend({
    template: '#email-list-template',
    childView: EmailElement,
    ui: {
        error: '.email-error'
    },
    initialize: function () {
        var self = this;
        Backbone.Radio.channel('default').on('add:collection', function(model){
        	self.collection.add(model);
        });

        Backbone.Radio.channel('default').on('EmailViews:EmailElement:emailDestroyed', function (payload){
            self.collection.get(payload.cid).destroy();
            self.render();
        });

        Backbone.Radio.channel('default').on('collection:render', function() {
            self.render();
        });

        Backbone.Radio.channel('default').on('collection:resort', function() {
            self.collection.sort();
        });

        Backbone.Radio.channel('default').on('error:message', function(payload){
            self.ui.error.remove();
            var element = $('#error-message').html(),
            tpl = _.template(element),
            template = tpl(payload);
            self.$el.append(template);
            _.delay(function(){
                self.render();
            }, 5000);
        });
    },
    childViewContainer: '#email-list',
    emptyView: NoEmailsView
});

// //////////
// Initialize models and views
// //////////
var emailList = [

];

var collectionEmails = new EmailCollection();
collectionEmails.add(emailList);

var emailsCompositeView = new EmailList({
	collection: collectionEmails
});

var addEmail = new EmailAdd({});

// //////////
// App creation and start
// //////////
var app = new Mn.Application();

var RootView = Mn.LayoutView.extend({
 	el: '#app-layout',
 	regions: {
 		'content': '#content',
 		'form': '#form'
 	}
});

app.rootView = new RootView();

app.rootView.content.show(emailsCompositeView);
app.rootView.form.show(addEmail);

app.start();


}());