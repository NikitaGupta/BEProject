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

var phi = 0, theta = 0;

var isUser = false, lat = 0, lon = 0;

var cubeTarget, mesh;
var monetaryDataArray = new Array();
var volumeDataArray = new Array();

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

    renderer = new THREE.CanvasRenderer();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container.appendChild(renderer.domElement);

    mesh = new THREE.Mesh(new THREE.SphereGeometry(450, 20, 20), new THREE.MeshBasicMaterial(
        { ambient:0xFFFFFF, map:THREE.ImageUtils.loadTexture('back1.png')}));
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

function drawData(product, year) {
    getProductData(product, year);

    monetaryDataArray = new Array();

    volumeDataArray = new Array();

    for (var i = 0; i < 11; i++) {
        var geometry = new THREE.Geometry();

        var vector = new THREE.Vector3(coOrdinates[i][0] * 2 - 1, coOrdinates[i][1] * 2 - 1, coOrdinates[i][2] * 2 - 1);
        vector.normalize();
        vector.multiplyScalar(450);

        geometry.vertices.push(new THREE.Vertex(vector));

        var vector2 = vector.clone();
        var temp = productData[i].Monetary;
        temp = temp / 60;
        vector2.multiplyScalar(temp * 0.6 + 1);

        geometry.vertices.push(new THREE.Vertex(vector2));

        var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color:0x66FF33, opacity:1, linewidth:3 }));
        scene.add(line);
        monetaryDataArray.push(line);

        // Volume

        geometry = new THREE.Geometry();
        vector = new THREE.Vector3((vcoOrdinates[i][0]) * 2 - 1, vcoOrdinates[i][1] * 2 - 1, vcoOrdinates[i][2] * 2 - 1);

        vector.normalize();
        vector.multiplyScalar(450);
        geometry.vertices.push(new THREE.Vertex(vector));

        vector2 = vector.clone();
        temp = productData[i].Volume;
        temp = temp / 1000;
        vector2.multiplyScalar(temp * 0.6 + 1);

        geometry.vertices.push(new THREE.Vertex(vector2));
        line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color:0xFFFF00, opacity:1, linewidth:3 }));
        scene.add(line);
        volumeDataArray.push(line);
    }

    document.addEventListener('mousedown', onDocumentMouseDown, false);

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    document.addEventListener('mouseup', onDocumentMouseUp, false);

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


function clearLines() {

    if (monetaryDataArray.length) {
        $.each(monetaryDataArray, function (index) {
            scene.remove(this);
        });
    }
    if (volumeDataArray.length) {
        $.each(volumeDataArray, function (index) {
            scene.remove(this);
        });
    }
}

function toggleDisplay(id){
    var temp;
    if(id=="Monetary")
        temp=monetaryDataArray;
    else
        temp=volumeDataArray;

    if ( $('#'+id).is(':checked')){
        $.each(temp, function (index) {
            scene.add(this);
        });
    }
    else {
        $.each(temp, function (index) {
            scene.remove(this);
        });
    }
}

