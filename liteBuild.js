const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { copySync } = require('fs-extra');

// オリジナルフォルダをコピーして作業用フォルダを作成
const tempFolder = './temp';
const tempBPFolder = path.join(tempFolder, 'BP');
const tempRPFolder = path.join(tempFolder, 'RP');

// コピーを作成する関数
function createWorkingCopy() {
  if (fs.existsSync(tempFolder)) {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  }
  fs.mkdirSync(tempFolder);
  copySync('./Core/BP', tempBPFolder);
  copySync('./Core/RP', tempRPFolder);
}

// パスの設定
const bpManifestPath = path.join(tempBPFolder, 'manifest.json');
const rpManifestPath = path.join(tempRPFolder, 'manifest.json');
const subpacksLowFolder = path.join(tempRPFolder, 'subpacks/low'); // 変更: subpacks/lowフォルダのパス
const rpTexturesFolder = path.join(tempRPFolder, 'textures'); // 変更: RP/texturesフォルダのパス

// manifest.jsonからzipファイル名を取得する関数
function getZipFileName(buildType = 'alpha') {
  if (!fs.existsSync(bpManifestPath)) {
    throw new Error('BPのmanifest.jsonが見つかりません。');
  }

  const manifestData = JSON.parse(fs.readFileSync(bpManifestPath, 'utf-8'));
  const version = manifestData.header?.version;

  if (!version || version.length < 3) {
    throw new Error('BPのmanifest.jsonに有効なversionが含まれていません。');
  }

  return `tapiopon-addon-lite-${buildType}-ver${version[0]}-${version[1]}-${version[2]}.mcaddon`;
}

// RPのmanifest.jsonを修正する関数
function modifyRPManifest() {
  if (!fs.existsSync(rpManifestPath)) {
    throw new Error('RPのmanifest.jsonが見つかりません。');
  }

  const rpManifestData = JSON.parse(fs.readFileSync(rpManifestPath, 'utf-8'));

  // 変更: subpacksを完全に削除
  if (rpManifestData.subpacks) {
    delete rpManifestData.subpacks;
  }

  fs.writeFileSync(rpManifestPath, JSON.stringify(rpManifestData, null, 2), 'utf-8');
  console.log('RPのmanifest.jsonを修正しました。');
}

// subpacks/low/texturesフォルダからRP/texturesへテクスチャを移動する関数
function moveTextures() {
  const texturesFolderInLow = path.join(subpacksLowFolder, 'textures'); // 正しいパスを指定

  if (fs.existsSync(texturesFolderInLow)) {
    if (!fs.existsSync(rpTexturesFolder)) {
      fs.mkdirSync(rpTexturesFolder, { recursive: true });
      console.log('RP/texturesフォルダを作成しました。');
    }

    // テクスチャフォルダをRP/texturesへ移動
    copySync(texturesFolderInLow, rpTexturesFolder, { overwrite: true });
    console.log(`テクスチャを ${texturesFolderInLow} から ${rpTexturesFolder} へ移動しました。`);
    
    // 移動後にsubpacksフォルダを削除
    fs.rmSync(path.join(tempRPFolder, 'subpacks'), { recursive: true, force: true });
    console.log('subpacksフォルダを削除しました。');

  } else {
    console.log('subpacks/low/texturesフォルダが見つかりません。');
  }
}

function createZipArchive(outputPath, folders) {
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // 圧縮レベルを最高に設定
  });

  output.on('close', () => {
    console.log(`圧縮が完了しました: ${outputPath} (サイズ: ${archive.pointer()} バイト)`);
    // 作業用フォルダを削除
    fs.rmSync(tempFolder, { recursive: true, force: true });
    console.log('作業用フォルダを削除しました。');
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // 各フォルダを追加
  folders.forEach(folder => {
    if (fs.existsSync(folder)) {
      archive.directory(folder, path.basename(folder));
    } else {
      console.warn(`${folder} フォルダが見つかりません。スキップします。`);
    }
  });

  archive.finalize();
}

try {
  const buildType = process.argv[2] || 'alpha'; // 引数がなければalphaをデフォルトに設定
  createWorkingCopy(); // 作業用フォルダを作成
  modifyRPManifest();
  moveTextures(); // テクスチャの移動とsubpacksフォルダの削除
  const zipFileName = getZipFileName(buildType);
  createZipArchive(zipFileName, [tempBPFolder, tempRPFolder]);
} catch (error) {
  console.error(`エラー: ${error.message}`);
}