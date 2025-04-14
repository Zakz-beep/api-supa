const express = require("express")
const app = express()
const {createClient} = require("@supabase/supabase-js")
const multer = require("multer")

const API_KEY = "https://kkcvrscfvsbescjdjuup.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrY3Zyc2NmdnNiZXNjamRqdXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MjM4OTUsImV4cCI6MjA2MDE5OTg5NX0.XVwLLlivz8w1FhftShXSiZhmkU8bTBs3PeSYCbL2dZg"
const supabase = createClient(API_KEY,ANON_KEY)
app.use(express.json())
const upload = multer({ storage: multer.memoryStorage() });

app.get("/products",async(req,res)=>{
    try{
        const {data,error} = await supabase.from("users").select("*")
        if(error){
            return res.status(401).json({message:"error",error})
        }
        return res.status(200).json({message:"berhasil",data})
    }catch(e){
        return res.status(500).json({message:"message error",errors:e})
    }
})
app.post('/products', async (req, res) => {
    try {
      const { Nama, Usia } = req.body;
      
      const { data, error } = await supabase
        .from('users')
        .insert([{ Nama, Usia }])
        .select();
      
      if (error) throw error;
      
      res.status(201).json({
        success: true,
        data: data[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  app.get("/products/:id",async(req,res)=>{
    const {id} = req.params
    const {Nama,Usia} = req.body
    try {
        const {data,error} = await supabase.from("users").select("*").eq("id",id).single()
        if(error){
            return res.status(400).json({message:"gagal",errors:error})
        }
        return res.status(200).json({message:"berhasil",data:data})
    } catch (error) {
        return res.status(500).json({message:"gagal"})
    }
  })
  app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { Nama, Usia } = req.body;
    
    // Validasi input
    if (!id || isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: "ID harus berupa angka yang valid" 
        });
    }
    
    const newId = parseInt(id);
    
    // Validasi data body
    if (!Nama || typeof Usia !== 'number') {
        return res.status(400).json({
            success: false,
            message: "Nama dan Usia harus diisi, Usia harus angka"
        });
    }

    try {
        // Gunakan .select() untuk mendapatkan data yang diupdate
        const { data, error } = await supabase
            .from("users")
            .update({ Nama, Usia })
            .eq("id", newId)
            .select();  // Penting untuk mendapatkan data yang diupdate
            
        if (error) {
            console.error('Supabase Error:', error);
            return res.status(400).json({
                success: false,
                message: "Gagal mengupdate data",
                error: error.message
            });
        }
        
        // Periksa jika data benar-benar terupdate
        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Data tidak ditemukan"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Data berhasil diupdate",
            data: data[0]
        });
        
    } catch (e) {
        console.error('Server Error:', e);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
});

// Endpoint upload ke bucket publik
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      const filePath = `public/${Date.now()}-${req.file.originalname}`;
      
      const { data, error } = await supabase.storage
        .from('my-bucket') // Nama bucket publik Anda
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });
  
      if (error) throw error;
  
      const { data: { publicUrl } } = supabase.storage
        .from('public-bucket')
        .getPublicUrl(filePath);
  
      res.json({
        success: true,
        message: 'File uploaded successfully',
        path: data.path,
        publicUrl
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
app.listen(3000,()=>console.log("server running on port 3000"))