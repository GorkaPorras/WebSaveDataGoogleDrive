var CLIENT_ID;
var API_KEY;

var DISCOVERY_DOCS;
var SCOPES;
var signinButton;
var signoutButton;

function handleClientLoad() {

    CLIENT_ID = '';
    API_KEY = '';

    DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
    SCOPES = 'https://www.googleapis.com/auth/drive';
    signinButton = document.getElementsByClassName('signin')[0];
    signoutButton = document.getElementsByClassName('signout')[0];



    gapi.load('client:auth2', initClient);
}

function initClient() {


    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
        plugin_name: 'admin'
    }).then(function () {

        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // check initial signin state
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        signinButton.onclick = handleSignin;
        signoutButton.onclick = handleSignout;


    }, function (error) {
        console.error(error);
    })
}


// now make function for signin checking
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        signinButton.style.display = 'none';
        signoutButton.style.display = 'block';
        checkFolder();
        document.getElementsByClassName('upload')[0].disabled=false;
    } else {
        signinButton.style.display = 'block';
        signoutButton.style.display = 'none';
        document.getElementsByClassName('upload')[0].disabled=true;
    }
}

// handle signin click
function handleSignin() {
    gapi.auth2.getAuthInstance().signIn();
}

// handle signout click
function handleSignout() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        location.reload();
    });
    auth2.disconnect();
}

// check for a Backup Folder in google drive
function checkFolder() {
    gapi.client.drive.files.list({
        'q': 'name = "Backup Folder"',
    }).then(function (response) {
        var files = response.result.files;
        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                localStorage.setItem('parent_folder', file.id);
                console.log('Folder Available');
            }
        } else {
            // if folder not available then create
            createFolder();

        }
    })
}

// now create a function to upload file
async function upload() {


    const ws = new WebSocket("ws://127.0.0.1:5001/");
    console.log(ws);

    ws.onopen = function (event) {

        console.log('conectado');
    };
    ws.onmessage = function (event) {
        var fileContent = event.data; // texto del txt

        const parentFolder = localStorage.getItem('parent_folder');

        var file = new Blob([fileContent], { type: 'text/plain' });
        var today = new Date();
        var date = today.toISOString().split('T')[0]
        var metadata = {
            'name': 'backup-file-' + date,// Filename at Google Drive 
            'mimeType': 'text/plain', // mimeType at Google Drive
            'parents': [parentFolder], // Folder ID at Google Drive
        };

        var accessToken = gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.
        var form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        var xhr = new XMLHttpRequest();
        xhr.open('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.responseType = 'json';
        xhr.onload = () => {
            console.log(xhr.response.id); // Retrieve uploaded file ID.
        };
        xhr.send(form);

    }



}
/*async function printFile(url) {

    const response = await fetch(url);
    const data = await response.text();
    console.log(data);
    var dataa;
    return dataa;

}*/
function createFolder() {
    var access_token = gapi.auth.getToken().access_token;
    var request = gapi.client.request({
        'path': 'drive/v2/files',
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        },
        'body': {
            'title': 'Backup Folder',
            'mimeType': 'application/vnd.google-apps.folder'
        }
    });
    request.execute(function (response) {
        localStorage.setItem('parent_folder', response.id);
    })
}


