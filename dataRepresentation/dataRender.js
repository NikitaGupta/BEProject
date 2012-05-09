var SCREEN_WIDTH = 800,
    SCREEN_HEIGHT = 600,

    mouseX = 0, mouseY = 0,

    windowHalfX = SCREEN_WIDTH / 2,
    windowHalfY = SCREEN_HEIGHT / 2,

    SEPARATION = 200,
    AMOUNTX = 10,
    AMOUNTY = 10,

    camera, scene, renderer;
var mouseX = 0, mouseY = 0;
var projector, intersected;
var phi = 0, theta = 0;

var isUser = false, lat = 0, lon = 0;

var cubeTarget, mesh;
var dataArray = new Array();

var movedFlag;
cubeTarget = new THREE.Vector3(0, 0, 0);

function drawGlobe() {

    var container, separation = 100, amountX = 50, amountY = 50, particles, particle;

    container = document.getElementById('canvasDiv');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000);
    camera.position.z = 1000;

    scene = new THREE.Scene();

    scene.add(camera);
    projector = new THREE.Projector();


    renderer = new THREE.WebGLRenderer();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container.appendChild(renderer.domElement);

    mesh = new THREE.Mesh(new THREE.SphereGeometry(450, 20, 20), new THREE.MeshLambertMaterial(
        { ambient:0xFFFFFF, map:THREE.ImageUtils.loadTexture('globe.jpg')}));
    mesh.overdraw = true;
    scene.add(mesh);


    ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    animate();
}

var productData;
var dataFiles = {};
var coOrdinates;
var vcoOrdinates;

function getData() {
    coOrdinates = new Array();
    vcoOrdinates = new Array();

    $.ajax({
        url:'data.json',
        dataType:'json',
        async:false,
        success:function (data, status) {
            $.extend(true, dataFiles, data);

            $.each(data, function (key, value) {
                coOrdinates.push(this.Coordinates);
                vcoOrdinates.push(this.vCoordinates);

            });
        },
        error:function (jqXHR, status, errorThrown) {
            alert(status);
        }
    });
}

function drawOnLoadData(product, year) {

    getProductData(product, year);
    dataArray = new Array();

    for (var i = 0; i < 11; i++) {

        var temp = productData[i].Monetary;
        temp = temp / 30;

        var object = new THREE.Mesh(new THREE.CubeGeometry(3, 3, 100), new THREE.MeshLambertMaterial({ color:0xffff00 }));

        object.material.ambient = object.material.color;
        object.position.x = coOrdinates[i][0] * 30 - 1;
        object.position.y = coOrdinates[i][1] * 30 - 1;
        object.position.z = coOrdinates[i][2] * 30 - 1;

        object.rotation.x = ( 0.08 * 360 ) * Math.PI / 180;
        object.rotation.y = ( 1 * 360 ) * Math.PI / 180;
        object.rotation.z = ( 1 * 360 ) * Math.PI / 180;

        object.scale.x = 1 * 2 + 1;
        object.scale.y = 1 * 2 + 1;
        object.scale.z = temp * 2 + 1;
        object.data = productData[i];

        object.lookAt(mesh.position);
        scene.add(object);

        dataArray.push(object);

    }
    animate();
}

function getProductData(productType, year) {
    productData = new Array();
    _.each(dataFiles, function (obj, key) {
        var country = key;
        _.each(obj.Products, function (product) {
            if (product.Type == productType) {
                productData.push(_.extend({'Country':country}, product.Year[year]));
            }
        });
    });
}


function onDocumentMouseDown(event) {

    if ((event.clientX > 300 && event.clientX < 950) && (event.clientY < 450)) {

        event.preventDefault();
        isUser = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
        onPointerDownLon = lon;
        onPointerDownLat = lat;

    }

}

function onDocumentMouseMove(event) {
    if (isUser && (event.clientX > 300 && event.clientX < 950) && (event.clientY < 450)) {
        lon = -( mouseX - event.clientX ) + onPointerDownLon;
        lat = ( event.clientY - mouseY ) + onPointerDownLat;
    }
    else if (!isUser) {

        mouseX = ( event.clientX / SCREEN_WIDTH ) * 2 - 1;
        mouseY = -( event.clientY / SCREEN_HEIGHT ) * 2 + 1;
    }

    var vector = new THREE.Vector3(mouseX, mouseY, 1);
    projector.unprojectVector(vector, camera);
    var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
    var intersects = ray.intersectObjects(scene.children);

    if (intersects.length > 0) {

        if (intersects.length == 1 && intersects[0].object.geometry instanceof THREE.SphereGeometry)
            $('#msgContainer').hide();
        else {

            var ID = $('input[type=radio]:checked').attr('id');

            _.each(intersects, function (intersectedObject) {
                if (intersectedObject.object.geometry instanceof THREE.CubeGeometry)
                    $('#msgContainer').html("<br> Country : " + intersectedObject.object.data.Country +
                        "<br>" + ID + " : " + intersectedObject.object.data[ID] + "<br><br>");
                $("#msgContainer").css({top:event.clientY, left:event.clientX}).show();
            });
        }
    } else {
        intersected = null;
        $('#msgContainer').hide();
    }
}

function onDocumentMouseUp(event) {
    isUser = false;
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {

    lat = Math.max(-85, Math.min(85, lat));
    phi = ( 90 - lat ) * Math.PI / 180;
    theta = lon * Math.PI / 180;
    camera.position.x = 1200 * Math.sin(phi) * Math.cos(theta);
    camera.position.y = 1200 * Math.cos(phi);
    camera.position.z = 1200 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(scene.position);


    cubeTarget.x = -camera.position.x;
    cubeTarget.y = -camera.position.y;
    cubeTarget.z = -camera.position.z;
    renderer.clear();
    renderer.render(scene, camera);

}

function changeSalesData(id) {
    var scale, newColour;
    var ID = id;

    switch (id) {
        case 'Monetary':
            scale = 30;
            newColour = '0xFFFF00';
            break;
        case 'Volume' :
            scale = 1000;
            newColour = '0x00FF00';
            break;
    }

    $.each(dataArray, function (index,object) {
//        scene.remove(this);
        object.scale.z = (productData[index][ID] /scale ) *2 +1;
        object.material.color.setHex(newColour);
    });
}
