const reviewVote=value=>({K:'liked',X:'disliked'})[value]||'unmarked';
function reviewReport(manifest,state){
  return {schemaVersion:3,roundId:manifest.round_id,round:manifest.round_label,title:manifest.title,reviewer:state.name||'',updated:state.updated||'',overallComment:state.overall||'',videos:manifest.videos.map(v=>({id:v.id,name:v.name||v.label,filename:v.filename,reference:v.reference||'',variant:v.variant||'',videoFile:v.src,sha256:v.sha256,width:v.width,height:v.height,fps:v.fps,vote:reviewVote(state.videoAnswers?.[v.id]),comment:state.videoNotes?.[v.id]||'',clips:v.shots.map(s=>({id:s.id,clipNumber:s.number,vote:reviewVote(state.answers?.[s.id]),comment:state.notes?.[s.id]||'',sourceFilename:s.source_filename,sourcePath:s.source,sourceInSeconds:s.source_start,sourceOutSeconds:s.source_end,videoInSeconds:s.start,videoOutSeconds:s.end,videoInFrame:s.start_frame,videoOutFrameExclusive:s.end_frame,thumbnailFrame:s.frame_number,thumbnailTimeSeconds:s.frame_time}))}))};
}

export {reviewReport};
