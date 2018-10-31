# Presentify (Name still in consideration)

An framework for building a graphical editor. We intent to first build a simple image tool, followed by an slides editor. Slowly we want to add features, hopefully with a robust way to extend it modularly.

## Start

Clone this repo

```
npm install
npm run
```

## Components

### <Canvas /\>
Very good work by @pocket-titan.
This component creates a pan- and zoomable area where you can lay out items. Click events in those items will have their coordinates transformed as well.

**props**  
- transformation: `TransformationMatrix`
- onTransformChange: `(TransformationMatrix) => void`
- onBackgroundClick: `() => void`
- initialTranslation: `{ x: Number, y: Number }?`
