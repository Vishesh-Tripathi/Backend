const asyncHandler = (requestHandler)=>{
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>{
            next(err)
        })
    }
}
export {asyncHandler}

// method 2 

// const asyncHandler = ()=>{}
// const asyncHandler = (fn)=>{()=>{}}
// const asyncHandler = (fn) =>()=>{}

    // const asyncHandler = (fn)=>async(req,res,next)=>{
    //     try {
            
    //     } catch (error) {
    //         res.status(error.code || 404).json({
    //             success : false,
    //             message : error.message
    //         })
    //     }
    // }