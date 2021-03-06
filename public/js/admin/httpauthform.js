/*
 * @author     Martin Høgh <mh@mapcentia.com>
 * @copyright  2013-2018 MapCentia ApS
 * @license    http://www.gnu.org/licenses/#AGPL  GNU AFFERO GENERAL PUBLIC LICENSE 3
 *  
 */

Ext.namespace('httpAuth');
httpAuth.form = new Ext.FormPanel({
    method: 'put',
    frame: false,
    border: false,
    region: "north",
    labelWidth: 1,
    defaults: {
        anchor: '95%',
        allowBlank: false,
        msgTarget: 'side'
    },
    items: [new Ext.Panel({
        frame: false,
        border: false,
        bodyStyle: 'padding: 7px 7px 10px 7px;',
        contentEl: "authentication"
    }), {
        xtype: 'textfield',
        inputType: 'password',
        id: 'httpAuthForm',
        name: 'pw',
        emptyText: 'Password'
    }],
    buttons: [
        {
            text: __('Update'),
            handler: function () {
                "use strict";
                if (httpAuth.form.getForm().isValid()) {
                    httpAuth.form.getForm().submit({
                        url: '/controllers/setting/pw',
                        success: httpAuth.onSubmit,
                        failure: httpAuth.onSubmit
                    });
                }
            }
        }
    ]
    //html: "Set password for WFS http authentication"
});
httpAuth.onSubmit = function (form, action) {
    "use strict";
    var result = action.result;
    if (result.success) {
        Ext.MessageBox.alert('Success', result.message);
        //httpAuth.form.reset();
    } else {
        Ext.MessageBox.alert('Failure', result.message);
    }
};
