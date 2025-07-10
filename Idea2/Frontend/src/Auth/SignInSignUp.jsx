import axios from 'axios'
import { use, useState } from 'react';
import {Link, useNavigate} from 'react-router-dom'


const SignInSignUp = () =>{
const navigate = useNavigate();
const [username, setUsername] = useState("")
const [password, setPassword] = useState("")

const handleSubmit = async() =>{
    try {
        console.log("hello")
        const resp = await axios.post("http://localhost:8000/api/login",{
            username: username,
            password: password
        },
        {
        withCredentials: true
    })

        console.log(resp.status)
        if(resp.status == 200){
            navigate("/")
            alert("user logged in successfully");
        }


    } catch (error) {
        if(error.status == 404){
            alert("user not found");
        }
        else if(error.status == 500){
            alert("Internal server error");
        }
        else if(error.status == 422){
            alert("Username or password is wrong");
        }
        else{
            console.log("Error here = ",error);
        }
    }
}

const handleUsernameInput = (e) =>{
    setUsername(e.target.value);
}
const handlePasswordInput = (e) =>{
    setPassword(e.target.value);
}



    return(
        <div>

        <div>
          <h2>Uername</h2>
          <input type="text" value={username} onChange={handleUsernameInput} />

        </div>

        <div>
          <h2>password</h2>
          <input type="text" value={password} onChange={handlePasswordInput}/> 

        </div>

        <div>

          <button onClick={()=>{handleSubmit()}}>Submit</button>
        </div>
         


        </div>
)};

export default SignInSignUp;